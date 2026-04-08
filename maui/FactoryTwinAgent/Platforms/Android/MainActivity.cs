using Android.App;
using Android.Content;
using Android.Content.PM;
using Android.OS;

namespace FactoryTwinAgent
{
    [Activity(Theme = "@style/Maui.SplashTheme", MainLauncher = true, LaunchMode = LaunchMode.SingleTop, ConfigurationChanges = ConfigChanges.ScreenSize | ConfigChanges.Orientation | ConfigChanges.UiMode | ConfigChanges.ScreenLayout | ConfigChanges.SmallestScreenSize | ConfigChanges.Density)]
    public class MainActivity : MauiAppCompatActivity
    {
        protected override void OnCreate(Bundle? savedInstanceState)
        {
            base.OnCreate(savedInstanceState);
            // 포그라운드 서비스 시작 — 백그라운드에서도 폴링·보고 유지
            var intent = new Intent(this, typeof(Platforms.Android.KeepAliveService));
            StartForegroundService(intent);
        }
    }
}
