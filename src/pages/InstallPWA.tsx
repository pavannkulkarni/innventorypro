import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Download, Check } from "lucide-react";
import { toast } from "sonner";

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      toast.error("Installation not available. Try adding from your browser menu.");
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      toast.success("App installed successfully!");
      setIsInstalled(true);
    }
    
    setDeferredPrompt(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Install App</h1>
        <p className="text-muted-foreground">
          Install Inventory Pro on your device for quick access
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              Install on Mobile
            </CardTitle>
            <CardDescription>
              Get the full app experience on your phone
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isInstalled ? (
              <div className="flex items-center gap-2 p-4 bg-success/10 border border-success rounded-lg">
                <Check className="h-5 w-5 text-success" />
                <p className="text-sm font-medium">App is already installed!</p>
              </div>
            ) : (
              <>
                {deferredPrompt ? (
                  <Button onClick={handleInstall} className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Install Now
                  </Button>
                ) : (
                  <div className="space-y-3 text-sm">
                    <p className="font-medium">Manual Installation:</p>
                    <div className="space-y-2">
                      <p className="text-muted-foreground">
                        <strong>iPhone/iPad:</strong>
                      </p>
                      <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                        <li>Tap the Share button</li>
                        <li>Scroll and tap "Add to Home Screen"</li>
                        <li>Tap "Add"</li>
                      </ol>
                    </div>
                    <div className="space-y-2">
                      <p className="text-muted-foreground">
                        <strong>Android:</strong>
                      </p>
                      <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                        <li>Tap the menu (⋮) in your browser</li>
                        <li>Tap "Install app" or "Add to Home screen"</li>
                        <li>Tap "Install"</li>
                      </ol>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Why Install?</CardTitle>
            <CardDescription>
              Benefits of installing the app
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              <li className="flex gap-2">
                <Check className="h-5 w-5 text-success shrink-0" />
                <span>Quick access from your home screen</span>
              </li>
              <li className="flex gap-2">
                <Check className="h-5 w-5 text-success shrink-0" />
                <span>Works offline for basic features</span>
              </li>
              <li className="flex gap-2">
                <Check className="h-5 w-5 text-success shrink-0" />
                <span>Faster loading times</span>
              </li>
              <li className="flex gap-2">
                <Check className="h-5 w-5 text-success shrink-0" />
                <span>Full-screen experience</span>
              </li>
              <li className="flex gap-2">
                <Check className="h-5 w-5 text-success shrink-0" />
                <span>Camera access for barcode scanning</span>
              </li>
              <li className="flex gap-2">
                <Check className="h-5 w-5 text-success shrink-0" />
                <span>No app store required</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
