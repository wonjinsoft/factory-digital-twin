using Websocket.Client;
using System.Text.Json;

namespace FactoryTwinAgent.Services;

public class AgentService
{
    private readonly IFlashlight _flashlight;
    private readonly IBattery _battery;
    private WebsocketClient? _wsClient;
    private readonly HttpClient _httpClient = new();

    private const string DeviceId = "phone1";
    private const string ServerUrl = "https://factory-digital-twin-production-7e7f.up.railway.app"; 
    private const string WsUrl = "wss://factory-digital-twin-production-7e7f.up.railway.app/ws/state";


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
        await ConnectWebSocketAsync();
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

    private async Task ConnectWebSocketAsync()
    {
        var uri = new Uri(WsUrl);
        _wsClient = new WebsocketClient(uri)
        {
            ReconnectTimeout = TimeSpan.FromSeconds(10)
        };

        _wsClient.MessageReceived.Subscribe(msg => HandleMessage(msg.Text));

        _wsClient.ReconnectionHappened.Subscribe(_ =>
        {
            ConnectionStatus = "연결됨";
            StateChanged?.Invoke();
        });

        _wsClient.DisconnectionHappened.Subscribe(_ =>
        {
            ConnectionStatus = "연결 끊김";
            StateChanged?.Invoke();
        });

        await _wsClient.Start();
        ConnectionStatus = "연결됨";
        StateChanged?.Invoke();
    }

    private void HandleMessage(string? json)
    {
        if (string.IsNullOrEmpty(json)) return;

        MainThread.BeginInvokeOnMainThread(() =>
        {
            DebugMessage = $"수신: {json[..Math.Min(json.Length, 60)]}";
            StateChanged?.Invoke();
        });

        try
        {
            var doc = JsonDocument.Parse(json);
            var type = doc.RootElement.GetProperty("type").GetString();
            if (type != "device_update") return;

            var data = doc.RootElement.GetProperty("data");
            if (data.GetProperty("device_id").GetString() != DeviceId) return;

            var flash = data.GetProperty("flash").GetString();
            MainThread.BeginInvokeOnMainThread(async () =>
            {
                await ApplyFlashAsync(flash == "on");
            });
        }
        catch (Exception ex)
        {
            MainThread.BeginInvokeOnMainThread(() =>
            {
                DebugMessage = $"오류: {ex.Message}";
                StateChanged?.Invoke();
            });
        }
    }

    private async Task ApplyFlashAsync(bool on)
    {
        FlashStatus = on ? "ON" : "OFF";
        DebugMessage = $"플래시 → {FlashStatus}";
        StateChanged?.Invoke();

        try
        {
            if (on)
                await _flashlight.TurnOnAsync();
            else
                await _flashlight.TurnOffAsync();
        }
        catch
        {
            DebugMessage = $"플래시 {FlashStatus} (Windows: 하드웨어 없음)";
            StateChanged?.Invoke();
        }
    }

    private async Task ReportLoopAsync()
    {
        while (true)
        {
            await Task.Delay(TimeSpan.FromSeconds(10));
            await ReportStatusAsync();
        }
    }

    private async Task ReportStatusAsync()
    {
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