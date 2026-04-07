using CommunityToolkit.Maui;
using FactoryTwinAgent.Services;

namespace FactoryTwinAgent;

public static class MauiProgram
{
    public static MauiApp CreateMauiApp()
    {
        var builder = MauiApp.CreateBuilder();
        builder
            .UseMauiApp<App>()
            .UseMauiCommunityToolkit()
            .ConfigureFonts(fonts =>
            {
                fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
                fonts.AddFont("OpenSans-Semibold.ttf", "OpenSansSemibold");
            });

        builder.Services.AddSingleton<IFlashlight>(Flashlight.Default);
        builder.Services.AddSingleton<IBattery>(Battery.Default);
        builder.Services.AddSingleton<AgentService>();
        builder.Services.AddSingleton<MainPage>();

        return builder.Build();
    }
}