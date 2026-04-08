using Android.App;
using Android.Content;
using Android.Content.PM;
using Android.OS;

namespace FactoryTwinAgent.Platforms.Android;

/// <summary>
/// 포그라운드 서비스 — 앱이 백그라운드로 내려가도 OS가 프로세스를 종료하지 않도록 유지.
/// AgentService의 폴링·보고 루프는 별도 Task로 계속 실행됨.
/// </summary>
[Service(Exported = false, ForegroundServiceType = ForegroundService.TypeDataSync)]
public class KeepAliveService : Service
{
    public const string ChannelId = "factory_twin_channel";
    public const int NotificationId = 1001;

    public override IBinder? OnBind(Intent? intent) => null;

    public override StartCommandResult OnStartCommand(Intent? intent, StartCommandFlags flags, int startId)
    {
        CreateNotificationChannel();
        var notification = BuildNotification();

        if (OperatingSystem.IsAndroidVersionAtLeast(29))
            StartForeground(NotificationId, notification, ForegroundService.TypeDataSync);
        else
            StartForeground(NotificationId, notification);

        return StartCommandResult.Sticky;
    }

    public override void OnDestroy()
    {
        base.OnDestroy();
        StopForeground(StopForegroundFlags.Remove);
    }

    private void CreateNotificationChannel()
    {
        var channel = new NotificationChannel(
            ChannelId,
            "Factory Twin Agent",
            NotificationImportance.Low
        )
        { Description = "디지털 트윈 에이전트 실행 중" };

        var manager = (NotificationManager)GetSystemService(NotificationService)!;
        manager.CreateNotificationChannel(channel);
    }

    private Notification BuildNotification()
    {
        var intent = new Intent(this, typeof(MainActivity));
        intent.SetFlags(ActivityFlags.SingleTop);
        var pendingIntent = PendingIntent.GetActivity(
            this, 0, intent, PendingIntentFlags.Immutable);

        return new Notification.Builder(this, ChannelId)
            .SetContentTitle("Factory Twin Agent")
            .SetContentText("디지털 트윈 에이전트 실행 중 🏭")
            .SetSmallIcon(global::Android.Resource.Drawable.IcDialogInfo)
            .SetContentIntent(pendingIntent)
            .SetOngoing(true)
            .Build()!;
    }
}
