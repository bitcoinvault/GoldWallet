#import <React/RCTBridgeModule.h>
#import <Security/Security.h>

@interface GoldWalletLegacySecureStorage : NSObject <RCTBridgeModule>
@end

@implementation GoldWalletLegacySecureStorage

RCT_EXPORT_MODULE(GoldWalletLegacySecureStorage)

static NSString *const LegacyServiceName = @"RNSecureKeyStoreKeyChain";

- (dispatch_queue_t)methodQueue
{
  return dispatch_queue_create("io.goldwallet.legacy-secure-storage-migration", DISPATCH_QUEUE_SERIAL);
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (NSMutableDictionary *)queryForKey:(NSString *)key
{
  NSData *encodedKey = [key dataUsingEncoding:NSUTF8StringEncoding];
  return [@{
    (__bridge id)kSecClass: (__bridge id)kSecClassGenericPassword,
    (__bridge id)kSecAttrGeneric: encodedKey,
    (__bridge id)kSecAttrAccount: encodedKey,
    (__bridge id)kSecAttrService: LegacyServiceName,
  } mutableCopy];
}

RCT_EXPORT_METHOD(get:(NSString *)key
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  NSMutableDictionary *query = [self queryForKey:key];
  query[(__bridge id)kSecMatchLimit] = (__bridge id)kSecMatchLimitOne;
  query[(__bridge id)kSecReturnData] = @YES;

  CFTypeRef result = NULL;
  OSStatus status = SecItemCopyMatching((__bridge CFDictionaryRef)query, &result);
  if (status == errSecItemNotFound) {
    resolve([NSNull null]);
    return;
  }
  if (status != errSecSuccess) {
    reject(@"LEGACY_SECURE_STORAGE_READ_FAILED", @"Unable to read legacy secure storage", nil);
    return;
  }

  NSData *data = CFBridgingRelease(result);
  resolve([[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding] ?: [NSNull null]);
}

RCT_EXPORT_METHOD(remove:(NSString *)key
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  OSStatus status = SecItemDelete((__bridge CFDictionaryRef)[self queryForKey:key]);
  if (status == errSecSuccess || status == errSecItemNotFound) {
    resolve(@YES);
    return;
  }

  reject(@"LEGACY_SECURE_STORAGE_REMOVE_FAILED", @"Unable to remove legacy secure storage value", nil);
}

@end
