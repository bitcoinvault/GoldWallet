
#import "AppDelegate.h"

#import <React/RCTLinkingManager.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import <RCTDefaultReactNativeFactoryDelegate.h>
#import <RCTReactNativeFactory.h>
#import <RCTAppDependencyProvider.h>
#import <Firebase.h>
#import "RNBootSplash.h"
#import "ReactNativeConfig.h"
#import <UserNotifications/UserNotifications.h>
#import <RNCPushNotificationIOS.h>

@interface ReactNativeDelegate : RCTDefaultReactNativeFactoryDelegate
@end

@interface AppDelegate ()
@property (nonatomic, strong) ReactNativeDelegate *reactNativeDelegate;
@property (nonatomic, strong) RCTReactNativeFactory *reactNativeFactory;
@end

@implementation ReactNativeDelegate

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

- (void)customizeRootView:(RCTRootView *)rootView
{
  [super customizeRootView:rootView];
  rootView.backgroundColor = [UIColor systemBackgroundColor];
  [RNBootSplash initWithStoryboard:@"Launch Screen" rootView:rootView];
}

@end

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
   if ([FIRApp defaultApp] == nil) {
     [FIRApp configure];
   }
  
  [FIRMessaging messaging].autoInitEnabled = YES;

  self.reactNativeDelegate = [ReactNativeDelegate new];
  self.reactNativeDelegate.dependencyProvider = [RCTAppDependencyProvider new];
  self.reactNativeFactory = [[RCTReactNativeFactory alloc] initWithDelegate:self.reactNativeDelegate];
  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  [self.reactNativeFactory startReactNativeWithModuleName:[ReactNativeConfig envFor:@"APPLICATION_NAME"]
                                                 inWindow:self.window
                                            launchOptions:launchOptions];

  UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
  center.delegate = self;
  
  return YES;
}

//Called when a notification is delivered to a foreground app.
-(void)userNotificationCenter:(UNUserNotificationCenter *)center willPresentNotification:(UNNotification *)notification withCompletionHandler:(void (^)(UNNotificationPresentationOptions options))completionHandler
{
  completionHandler(UNNotificationPresentationOptionSound | UNNotificationPresentationOptionAlert | UNNotificationPresentationOptionBadge);
}

- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {
  return [RCTLinkingManager application:app openURL:url options:options];
}

- (BOOL)application:(UIApplication *)application shouldAllowExtensionPointIdentifier:(UIApplicationExtensionPointIdentifier)extensionPointIdentifier {
  return NO;
}


- (void)applicationDidBecomeActive:(UIApplication *)application {
// delete the badge
   [UIApplication sharedApplication].applicationIconBadgeNumber = 0;
// delete the notifications
  [[UNUserNotificationCenter currentNotificationCenter] removeAllDeliveredNotifications];

}

-(void)applicationWillResignActive:(UIApplication *)application{
  [UIApplication sharedApplication].applicationIconBadgeNumber = 0;
  
  [[UNUserNotificationCenter currentNotificationCenter] removeAllDeliveredNotifications];
}
//
// Required for the register event.
- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{
 [RNCPushNotificationIOS didRegisterForRemoteNotificationsWithDeviceToken:deviceToken];
}
// Required for the notification event. You must call the completion handler after handling the remote notification.
- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo
fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  [RNCPushNotificationIOS didReceiveRemoteNotification:userInfo fetchCompletionHandler:completionHandler];
}
// Required for the registrationError event.
- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error
{
 [RNCPushNotificationIOS didFailToRegisterForRemoteNotificationsWithError:error];
}
// Required for localNotification event
- (void)userNotificationCenter:(UNUserNotificationCenter *)center
didReceiveNotificationResponse:(UNNotificationResponse *)response
         withCompletionHandler:(void (^)(void))completionHandler
{
  [RNCPushNotificationIOS didReceiveNotificationResponse:response];
}

@end
