using Android.Content;
using Android.Hardware.Camera2;

namespace FactoryTwinAgent.Platforms.Android;

public static class FlashlightHelper
{
    public static void TurnOn_Off(bool on)
    {
        var manager = Platform.AppContext
            .GetSystemService(Context.CameraService) as CameraManager;
        if (manager == null) return;

        foreach (var cameraId in manager.GetCameraIdList())
        {
            var chars = manager.GetCameraCharacteristics(cameraId);
            var flashAvailable = chars.Get(
                CameraCharacteristics.FlashInfoAvailable) as Java.Lang.Boolean;
            if (flashAvailable?.BooleanValue() == true)
            {
                manager.SetTorchMode(cameraId, on);
                return;
            }
        }
    }
}