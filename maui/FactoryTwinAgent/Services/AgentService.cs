using System.Text.Json;

namespace FactoryTwinAgent.Services;

public class AgentService
{
    private readonly IFlashlight _flashlight;
    private readonly IBattery _battery;
    private readonly HttpClient _httpClient = new();

    private const string DeviceId = "phone1";
    private const string ServerUrl = "https://factory-digital-twin-production-7e7f.up.railway.app";

    private string _lastFlashState = "";

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

    private async Task ReportLoopAsync()
    {
        while (true)
        {
            await Task.Delay(TimeSpan.FromSeconds(10));
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

                var content = new StringContent(
                    body, System.Text.Encoding.UTF8, "application/json");

                await _httpClient.PostAsync(
                    $"{ServerUrl}/devices/{DeviceId}/report", content);
            }
            catch { }
        }
    }
}