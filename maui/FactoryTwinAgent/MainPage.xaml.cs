using FactoryTwinAgent.Services;

namespace FactoryTwinAgent;

public partial class MainPage : ContentPage
{
    private readonly AgentService _agent;

    public MainPage(AgentService agent)
    {
        InitializeComponent();
        _agent = agent;
        _agent.StateChanged += OnStateChanged;
    }

    private bool _isRunning = true;

    private async void OnToggleClicked(object sender, EventArgs e)
    {
        if (_isRunning)
        {
            await _agent.PauseAsync();
#if ANDROID
            var stopIntent = new Android.Content.Intent(
                Android.App.Application.Context,
                typeof(Platforms.Android.KeepAliveService));
            Android.App.Application.Context.StopService(stopIntent);
#endif
        }
        else
        {
            await _agent.ResumeAsync();
#if ANDROID
            var startIntent = new Android.Content.Intent(
                Android.App.Application.Context,
                typeof(Platforms.Android.KeepAliveService));
            Android.App.Application.Context.StartForegroundService(startIntent);
#endif
        }
        _isRunning = !_isRunning;
        UpdateToggleButton();
    }

    private void UpdateToggleButton()
    {
        MainThread.BeginInvokeOnMainThread(() =>
        {
            if (_isRunning)
            {
                BtnToggle.Text = "⏹ 에이전트 중지";
                BtnToggle.BackgroundColor = Color.FromArgb("#ef4444");
            }
            else
            {
                BtnToggle.Text = "▶ 에이전트 시작";
                BtnToggle.BackgroundColor = Color.FromArgb("#22c55e");
            }
        });
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        await _agent.StartAsync();
    }

    private void OnStateChanged()
    {
        MainThread.BeginInvokeOnMainThread(() =>
        {
            LblConnection.Text = _agent.ConnectionStatus;
            LblConnection.TextColor = _agent.ConnectionStatus == "연결됨"
                ? Color.FromArgb("#22c55e")
                : Color.FromArgb("#ef4444");

            LblBattery.Text = $"{_agent.BatteryLevel} %";
            LblBattery.TextColor = _agent.BatteryLevel > 20
                ? Color.FromArgb("#22c55e")
                : Color.FromArgb("#ef4444");

            LblFlash.Text = _agent.FlashStatus;
            LblFlash.TextColor = _agent.FlashStatus == "ON"
                ? Color.FromArgb("#fbbf24")
                : Color.FromArgb("#64748b");

            LblDebug.Text = _agent.DebugMessage;
        });
    }
}