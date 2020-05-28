module.exports = {
  _: {
    storage_is_encrypted: 'ストレージは暗号化されています。それを復号化するためにはパスワードが必要です。',
    enter_password: 'パスワードの入力',
    bad_password: 'パスワードが間違っています。再度お試しください',
    never: '一度もない',
    continue: '続行する',
    ok: 'OK'
  },
  message: {
    somethingWentWrong: '問題が発生しました',
    somethingWentWrongWhileCreatingWallet: 'ウォレットの作成中に問題が発生しましたダッシュボードに戻って、再度お試しください。',
    success: '成功',
    successfullWalletImport: 'ウォレットは適切にインポートされました。現在ダッシュボードに戻ることができます。',
    successfullWalletDelete: 'ウォレットは適切に削除されました。現在ダッシュボードに戻ることができます。',
    returnToDashboard: 'ダッシュボードに戻る',
    creatingWallet: 'ウォレットの作成',
    creatingWalletDescription: 'ウォレットを作成している間お待ちください。しばらく時間がかかる場合があります。'
  },
  onboarding: {
    onboarding: '設定',
    pin: 'PINコード',
    createPin: 'PINコードの生成',
    createNewPin: '新しいPINコード',
    createPassword: 'トランザクションパスワードの生成',
    createPinDescription: 'PINコードはアプリケーションのログインに利用されます。設定メニューから変更可能です。',
    confirmPin: 'PINコードの確認',
    confirmNewPin: '新しいPINコードの確認',
    confirmPassword: 'トランザクションパスワードの確認',
    passwordDoesNotMatch: 'パスワードが一致しません。有効なパスワードを入力してください。',
    createPasswordDescription: 'すべてのトランザクションを確認するため、トランザクションパスワードが利用されます。設定されたパスワードの変更は不可能です。トランザクションのパスワードは8桁以上の英文字と数字で構成しなければなりません。',
    changePin: 'PINコードの変更',
    currentPin: '現在のPINコード',
    pinDoesNotMatch: 'パスワードが一致しません。有効なパスワードを入力してください。',
    successDescription: 'おめでとうございます！\nPINコード生成が正常に完了されました。',
    successDescriptionChangedPin: 'おめでとうございます！\nPINコード変更が正常に完了されました。',
    successButton: 'ダッシュボードに戻る',
    successButtonChangedPin: '設定に戻る'
  },
  unlock: {
    title: '解除',
    touchID: '"Gold Wallet"のTouch ID',
    confirmButton: '指紋認証を完了してください。',
    enter: 'PINコードの入力'
  },
  unlockTransaction: {
    headerText: 'トランザクションの確認',
    title: 'トランザクションパスワードの確認',
    description: 'トランザクションパスワードを確認し、トランザクションを続ける。'
  },
  wallets: {
    dashboard: {
      title: 'ウォレット',
      noWallets: 'ウォレットなし',
      noWalletsDesc1: '表示するウォレットがありません。',
      noWalletsDesc2: '最初のウォレットに追加する。',
      send: 'コインを送金する',
      receive: 'コインを受け取る',
      noTransactions: '表示するトランザクションがありません。'
    },
    walletModal: { btcv: 'BTCV', wallets: 'ウォレット' },
    importWallet: {
      title: 'ご使用のウォレットをインポートする',
      header: 'ウォレットのインポート',
      subtitle: 'ここにユーザーのニーモニック、秘密鍵、WIF、または取得したその他のものを入力してください。GoldWalletでは、最善を尽くして、正しいフォーマットを推測し、ウォレットをインポートします。',
      placeholder: 'ニーモニック、秘密鍵、WIF',
      import: 'QRコードをインポート',
      scanQrCode: 'またはスキャン',
      walletInUseValidationError: 'ウォレットはすでに使用されています。有効なウォレットを入力してください。'
    },
    exportWallet: { title: 'ニーモニックのフレーズ', header: 'ウォレットのエクスポート' },
    exportWalletXpub: { header: 'ウォレットXPUB' },
    deleteWallet: {
      title: 'ご使用のウォレットを削除する',
      header: 'ウォレットの削除',
      description1: '削除してもよろしいですか',
      description2: '？それを取り消すことはできません。',
      no: 'いいえ',
      yes: 'はい'
    },
    wallet: { none: 'なし', latest: '最新のトランザクション' },
    add: {
      title: '新しいウォレットの追加',
      subtitle: 'ウォレットに名前を付ける',
      description: '新しいウォレットの名前を入力してください。',
      inputLabel: '名前',
      addWalletButton: '新しいウォレットの追加',
      importWalletButton: 'ウォレットのインポート',
      advancedOptions: '高度なオプション',
      multipleAddresses: '複数のアドレス',
      singleAddress: '単一のアドレス',
      segwidAddress: '単一の24文字シードから生成されるsegwitアドレスのツリーを含めます。'
    },
    addSuccess: {
      title: '新しいウォレットの追加',
      subtitle: '成功',
      description: 'ウォレットが作成されました。時間を取って、このニーモニックのフレーズを紙に書いてください。それはバックアップです。それを使用して、他のデバイスでウォレットをリストアすることができます。',
      okButton: 'OK。これを書きました！'
    },
    details: {
      latestTransaction: '最新のトランザクション',
      typeLabel: '種類',
      nameLabel: '名前',
      exportWallet: 'ウォレットのエクスポート',
      showWalletXPUB: 'ウォレットXPUBを表示する',
      deleteWallet: 'ウォレットの削除',
      nameEdit: '名前の変更'
    },
    export: { title: 'ウォレットのエクスポート' },
    import: {
      title: 'インポート',
      explanation: 'ここにユーザーのニーモニック、秘密鍵、WIF、または取得したその他のものを入力してください。GoldWalletでは、最善を尽くして、正しいフォーマットを推測し、ウォレットをインポートします',
      imported: 'インポート済み',
      error: 'インポートできませんでした。提供されたデータが有効であることを確認してください。',
      success: '成功',
      do_import: '代わりにQRコードをインポート',
      scan_qr: 'またはスキャンしますか？'
    },
    scanQrWif: {
      go_back: '戻る',
      cancel: 'キャンセル',
      decoding: '復号',
      input_password: 'パスワードを入力する',
      password_explain: 'これはBIP38暗号化秘密鍵です',
      bad_password: '誤っているパスワード',
      wallet_already_exists: 'このウォレットはすでに存在しています',
      bad_wif: '誤っているWIF',
      imported_wif: 'インポート済みWIF',
      with_address: 'アドレスで',
      imported_segwit: 'インポート済みSegWit',
      imported_legacy: 'インポート済みLegacy',
      imported_watchonly: 'インポート済みWatch-only'
    }
  },
  transactions: {
    list: { conf: '確認' },
    details: {
      title: 'トランザクション',
      detailTitle: 'トランザクション詳細',
      transactionHex: 'トランザクションhex',
      transactionHexDescription: 'これは、署名済みで、ネットワークにブロードキャストする準備ができているトランザクションhexです',
      copyAndBoriadcast: '後ほどコピーおよびブロードキャスト',
      verify: 'coinb.inで確認',
      amount: '金額',
      fee: '料金',
      txSize: 'TXサイズ',
      satoshiPerByte: 'バイト当たりのSatoshi',
      from: '送信元',
      to: '送信先',
      bytes: 'バイト',
      copy: 'コピー',
      noLabel: 'ラベルなし',
      details: '詳細',
      transactionId: 'トランザクションID',
      confirmations: '確認',
      transactionDetails: 'トランザクション詳細',
      viewInBlockRxplorer: 'ブロックエクスプローラーの表示',
      addNote: 'メモの追加',
      note: 'メモ',
      inputs: '入力',
      ouputs: '出力',
      sendCoins: 'コインを送金する'
    }
  },
  send: {
    header: 'コインを送金する',
    success: {
      title: '成功',
      description: '万歳！適切にトランザクションを終了しました。',
      done: '終了',
      return: 'ダッシュボードに戻る'
    },
    details: {
      title: 'トランザクションの作成',
      amount_field_is_not_valid: '金額フィールドが有効ではありません',
      fee_field_is_not_valid: '料金フィールドが有効ではありません',
      address_field_is_not_valid: 'アドレスフィールドが有効ではありません',
      create_tx_error: 'トランザクションの作成中にエラーがありました。アドレスが有効であることを確認してください。',
      address: 'アドレス',
      amount_placeholder: '（BTCVの）送信する金額',
      fee_placeholder: '（BTCVの）追加のトランザクション料金',
      note_placeholder: '自分のためのメモ',
      cancel: 'キャンセル',
      scan: 'スキャン',
      send: '送金',
      next: '次へ',
      to: '送信先',
      feeUnit: 'Sat/B',
      fee: '料金：',
      create: 'インボイスの作成',
      remaining_balance: '残高',
      total_exceeds_balance: '送金する金額が利用可能な残高を上回っています。'
    },
    confirm: { sendNow: '今すぐ送金する' },
    create: {
      amount: '金額',
      fee: '料金',
      setTransactionFee: 'トランザクション料金の設定',
      headerText: 'ネットワークに多数の保留中のトランザクションがあるとき（1,500超）、より高い料金を支払うことにより、トランザクションの処理速度が早くなります。通常の金額は1～500 sat/bです'
    }
  },
  receive: {
    header: 'コインを受け取る',
    details: { amount: '金額', share: '共有する', receiveWithAmount: '金額とともに受け取る' }
  },
  settings: {
    language: '言語',
    general: '一般',
    security: 'セキュリティ',
    about: '情報',
    electrumServer: 'Electrumサーバー',
    advancedOptions: '高度なオプション',
    changePin: 'PINの変更',
    fingerprintLogin: '指紋でのログイン',
    aboutUs: '当社について',
    header: '設定',
    notSupportedFingerPrint: '該当デバイスはTouchIDをご利用いただけません。',
    TouchID: 'Touch IDを許可する',
    FaceID: 'Face IDを許可する',
    Biometrics: '生体認証を許可する'
  },
  aboutUs: {
    header: '当社について',
    releaseNotes: 'リリースノート',
    runSelfTest: 'セルフテストの実行',
    buildWithAwesome: '素晴らしいサービスを構築',
    rateGoldWallet: 'GoldWalletを評価する',
    goToOurGithub: '当社のGithubに進む',
    alwaysBackupYourKeys: '常に鍵をバックアップする',
    title: 'ゴールドウォレットは、Bitcoin Vaultウォレットのための無料のオープンソースです。ライセンス：MIT。'
  },
  electrumServer: {
    header: 'Electrumサーバー',
    title: 'Electrumサーバーの変更',
    description: 'アプリケーション連結のサーバー変更が可能です。基本的に提供されるアドレスのご利用をおすすめします。',
    save: '保存',
    useDefault: 'デフォルトを使用',
    host: 'ホスト',
    port: 'ポート',
    successfullSave: '変更は適切に保存されました。変更を有効にするために、再起動が必要な場合があります。',
    connectionError: '提供されたElectrumサーバーに接続できません'
  },
  advancedOptions: {
    title: '詳細設定',
    description: '詳細設定を活性化した場合、以下のウォレット設定が可能になります：P2SH, HD P2SH, HD segwit'
  },
  selectLanguage: {
    header: '言語',
    restartInfo: '新しい言語を選択したら、変更を有効にするために、GoldWalletの再起動が必要な場合があります',
    confirmation: '確認',
    confirm: '確認する',
    alertDescription: '言語を選択して、アプリケーションを再起動しますか？',
    cancel: 'キャンセル'
  },
  contactList: {
    cancel: 'キャンセル',
    search: '検索',
    bottomNavigationLabel: 'アドレス帳',
    screenTitle: 'アドレス帳',
    noContacts: '連絡先がありません',
    noContactsDesc1: '表示する連絡先がありません。 \nクリックして、',
    noContactsDesc2: '最初の連絡先を追加する。',
    noResults: '結果がありません'
  },
  contactCreate: {
    screenTitle: '新しい連絡先を追加する',
    subtitle: '新しい連絡先',
    description: '新しい連絡先の名前とアドレスを入力してください。',
    nameLabel: '名前',
    addressLabel: 'アドレス',
    buttonLabel: '新しい連絡先を追加する',
    successTitle: '成功',
    successDescription: '万歳！連絡先を適切に追加しました。',
    successButton: 'アドレス帳に戻る'
  },
  contactDetails: {
    nameLabel: '名前',
    addressLabel: 'アドレス',
    editName: '名前の変更',
    editAddress: 'アドレスの変更',
    sendCoinsButton: 'コインを送金する',
    showQRCodeButton: 'QRコードの表示',
    deleteButton: '連絡先の削除',
    share: '共有する'
  },
  contactDelete: {
    title: '連絡先を削除する',
    header: '連絡先の削除',
    description1: '削除してもよろしいですか',
    description2: '？\nそれを取り消すことはできません。',
    no: 'いいえ',
    yes: 'はい',
    success: '成功',
    successDescription: '連絡先は適切に削除されました。\nアドレス帳に戻ることができます。',
    successButton: 'アドレス帳に戻る'
  },
  scanQrCode: {
    permissionTitle: 'カメラを使用する許可',
    permissionMessage: 'カメラを使用する許可が必要です',
    ok: 'Ok',
    cancel: 'キャンセル'
  }
}
