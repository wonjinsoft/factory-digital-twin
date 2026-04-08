using System.Text.Json;

namespace FactoryTwinAgent.Services;

public class AgentService
{
    private readonly IFlashlight _flashlight;
    private readonly IBattery _battery;
    private readonly HttpClient _httpClient = new();

    private const string ServerUrl = "https://factory-digital-twin-production-7e7f.up.railway.app";
    private readonly string DeviceId = GetOrCreateDeviceId();

    private static string GetOrCreateDeviceId()
    {
#if ANDROID
        var androidId = Android.Provider.Settings.Secure.GetString(
            Android.App.Application.Context.ContentResolver,
            Android.Provider.Settings.Secure.AndroidId);
        if (!string.IsNullOrEmpty(androidId))
            return "phone_" + androidId[..8];  // 앞 8자만 사용
#endif
        var id = Preferences.Get("device_id", null as string);
        if (id == null)
        {
            id = "phone_" + Guid.NewGuid().ToString("N")[..8];
            Preferences.Set("device_id", id);
        }
        return id;
    }

    private string _lastFlashState = "";
    private bool _paused = false;

    public string ConnectionStatus { get; private set; } = "연결 안됨";
    public string FlashStatus { get; private set; } = "OFF";
    public int BatteryLevel { get; private set; } = 0;
    public string DebugMessage { get; private set; } = "";
    public event Action? StateChanged;

    public AgentService(IFlashlight flashlight, IBattery battery)
    {
        _flashlight = flashlight;
        _battery = battery;
    }

    public async Task StartAsync()
    {
        await RegisterDeviceAsync();
        _ = Task.Run(PollLoopAsync);
        _ = Task.Run(ReportLoopAsync);
    }

    public async Task PauseAsync()
    {
        _paused = true;
        ConnectionStatus = "중지됨";
        StateChanged?.Invoke();
        await ReportOfflineAsync();
    }

    public async Task ResumeAsync()
    {
        _paused = false;
        _lastFlashState = "";  // 상태 리셋하여 최신 명령 즉시 반영
        await RegisterDeviceAsync();
        ConnectionStatus = "연결됨";
        StateChanged?.Invoke();
    }

    private async Task RegisterDeviceAsync()
    {
        try
        {
            await _httpClient.PostAsync(
                $"{ServerUrl}/devices/{DeviceId}/register?device_type=smartphone", null);
        }
        catch { }
    }

    private async Task PollLoopAsync()
    {
        while (true)
        {
            await Task.Delay(TimeSpan.FromSeconds(2));
            if (_paused) continue;
            try
            {
                var response = await _httpClient.GetStringAsync(
                    $"{ServerUrl}/devices/{DeviceId}");

                var doc = JsonDocument.Parse(response);
                var flash = doc.RootElement.GetProperty("flash").GetString() ?? "off";

                ConnectionStatus = "연결됨";
                DebugMessage = $"poll: flash={flash}";

                if (flash != _lastFlashState)
                {
                    _lastFlashState = flash;
                    await MainThread.InvokeOnMainThreadAsync(async () =>
                    {
                        await ApplyFlashAsync(flash == "on");
                    });
                }
                else
                {
                    StateChanged?.Invoke();
                }
            }
            catch (Exception ex)
            {
                ConnectionStatus = "연결 끊김";
                DebugMessage = $"폴링오류: {ex.Message}";
                StateChanged?.Invoke();
            }
        }
    }

    private async Task ApplyFlashAsync(bool on)
    {
        FlashStatus = on ? "ON" : "OFF";
        DebugMessage = $"플래시 → {FlashStatus}";
        StateChanged?.Invoke();

        try
        {
#if ANDROID
            FactoryTwinAgent.Platforms.Android.FlashlightHelper.TurnOn_Off(on);
#else
            if (on)
                await _flashlight.TurnOnAsync();
            else
                await _flashlight.TurnOffAsync();
#endif
        }
        catch (Exception ex)
        {
            DebugMessage = $"{ex.GetType().Name}: {ex.Message}";
            StateChanged?.Invoke();
        }
    }

    public async Task ReportOfflineAsync()
    {
        try
        {
            var body = JsonSerializer.Serialize(new
            {
                battery = BatteryLevel,
                flash = "off",
                online = false
            });
            var content = new StringContent(body, System.Text.Encoding.UTF8, "application/json");
            await _httpClient.PostAsync($"{ServerUrl}/devices/{DeviceId}/report", content);
        }
        catch { }
    }

    private async Task ReportLoopAsync()
    {
        while (true)
        {
            await Task.Delay(TimeSpan.FromSeconds(10));
            if (_paused) continue;
            try
            {
                BatteryLevel = (int)(_battery.ChargeLevel * 100);
                StateChanged?.Invoke();

                var body = JsonSerializer.Serialize(new
                {
                    battery = BatteryLevel,
                    flash = FlashStatus.ToLower(),
                    online = true
                });

                var content = new StringContent(body, System.Text.Encoding.UTF8, "application/json");
                await _httpClient.PostAsync($"{ServerUrl}/devices/{DeviceId}/report", content);
            }
            catch { }
        }
    }
}
