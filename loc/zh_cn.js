module.exports = {
  _: {
    bad_password: '密码错误，请重试',
    cancel: '取消',
    click: '点击',
    confirm: '确认',
    continue: '继续',
    copied: '已复制！',
    copy: '复制',
    created: '创建日期',
    delete: '删除',
    enter_password: '输入密码',
    here: '这里',
    invalid: '无效',
    languageCode: 'zh-cn',
    never: '从不',
    next: '下一个',
    ok: '确认',
    or: '或',
    satoshi: '聪',
    save: '保存',
    scan: '扫描',
    storage_is_encrypted: '储存空间已加密。需要输入密码进行解密',
  },
  termsConditions: {
    header: '条款及细则',
    title: '协议条款',
    text: '',
    buttons: {
      agree: '我同意',
      disagree: '我不同意',
    },
    modal: {
      header: '您确定吗？',
      text: '请注意，如果您不同意我们的条款及细则，将无法使用Gold Wallet应用程序。\n您确定不同意吗？',
      noButton: '不，我改变了主意。',
      yesButton: '是的，我不同意。',
    },
  },
  aboutUs: {
    alwaysBackupYourKeys: '时刻备份您的秘钥',
    buildWithAwesome: '绝妙的架构：',
    goToOurGithub: '请访问我们的 Github',
    header: '关于我们',
    rateGoldWallet: '为 GoldWallet 评分',
    releaseNotes: '发行说明',
    runSelfTest: '运行自检',
    title: 'Gold wallet 是免费的开源比特币 Vault 钱包软件。由麻省理工授权。',
  },
  advancedOptions: {
    description: '启用高级选项将允许您选择以下钱包类型：\n  P2SH，HD P2SH，HD segwit。',
    title: '设置高级选项',
  },
  authenticators: {
    add: {
      description:
        '打开 Electrum Vault 桌面应用程序，并新建钱包。执行屏幕上的步骤，直至看到二维（QR）码。用该应用程序进行扫描，以继续。',
      subdescription: '您还可以通过选择以下选项导入验证器。',
      subtitle: '配对验证器',
      successDescription:
        '在安全地方写下该助记词。这是您的备份，用于恢复验证器。记住，确认“快速与取消”交易需要使用验证器。',
      successTitle: '您的验证器已就绪！',
      title: '添加新验证器',
    },
    delete: {
      subtitle: '删除您的验证器',
      success: '您的验证器已成功删除。您可随时新建一个。',
      title: '删除验证器',
    },
    enterPIN: {
      description: '将该 PIN 输入 Electrum Vault 应用程序中，以完成配对过程。',
      subtitle: '输入 PIN',
    },
    errors: {
      noEmpty: '该字段不能为空',
    },
    export: {
      title: '导出验证器',
    },
    import: {
      code: '代码：',
      desc1: '写下助记词或扫描想要导入的验证器的二维（QR）码。',
      desc2: '通过点击下面的“或扫描 二维（QR）码”扫描二维（QR）码',
      inUseValidationError: '名字必须是唯一的。请输入一个有效的名字。',
      mnemonicLength: '助记符应该有 12 个字符',
      multipleQrCodesDescription:
        '有些交易会产生多个二维（QR）码。请确保从 Electrum Vault 应用程序中扫描所有的二维（QR）码。',
      multipleQrCodesTitle: '扫描二维（QR）码',
      scanNext: '扫描下一个',
      subtitle: '导入您的验证器',
      success: '您已成功导入验证器。现在可供使用。',
      textAreaPlaceholder: '助记词',
      title: '导入验证器',
    },
    list: {
      noAuthenticators: '尚无验证器',
      noAuthenticatorsDesc1: '点击',
      noAuthenticatorsDesc2: '以添加您的首个验证器。',
      scan: '扫描',
      title: '比特币 Vault 验证器',
    },
    options: {
      delete: '删除验证器',
      export: '导出验证器',
      pair: '配对验证器',
      sectionTitle: '通用',
      title: '验证器选项',
    },
    pair: {
      descPin: '使用该 PIN 在桌面应用程序上确认验证器配对。',
      descPublicKey: '使用 GoldWallet 选项在创建钱包的过程中可使用该公钥在桌面应用程序中导入验证器。',
      pin: 'PIN',
      publicKey: '公钥',
      title: '配对验证器',
    },
    publicKey: {
      okButton: '好的，我知道了',
      subtitle: '在创建 2FA 钱包期间，可以使用此公钥将身份验证器导入到 Electrum Vault 桌面应用程序。',
      title: '公钥',
    },
    sign: {
      error: '验证器都不能进行交易签名',
    },
  },
  betaVersion: {
    button: '我同意承担风险',
    description:
      '在正式发布之前，GoldWallet 仍在接受最终测试。 该移动应用程序及程序上所有内容均基于“按原样 ”和“可使用”呈现。 使用该程序的风险由用户自行承担。',
    title: '这是 GoldWallet 钱包的测试版',
  },
  contactCreate: {
    addressLabel: '地址',
    buttonLabel: '添加新的联系人',
    description: '请输入您的新联系人姓名和地址。',
    nameCannotContainSpecialCharactersError: '名称不能包含特殊字符。',
    nameLabel: '姓名',
    nameMissingAlphanumericCharacterError: '名称缺少字母数字字符。',
    screenTitle: '添加新的联系人',
    subtitle: '新联系人',
    successButton: '返回地址簿',
    successDescription: '太好了！您已成功添加新联系人。',
    successTitle: '操作成功',
  },
  contactDelete: {
    description1: '是否确认删除',
    description2: '？\n  删除后无法撤销。',
    header: '删除联系人',
    no: '否',
    success: '操作成功',
    successButton: '返回地址簿',
    successDescription: '您的联系人已成功删除。\n  您现在可以返回地址簿。',
    title: '删除您的联系人',
    yes: '是',
  },
  contactDetails: {
    addressLabel: '地址',
    deleteButton: '删除联系人',
    editAddress: '编辑地址',
    editName: '编辑姓名',
    nameLabel: '姓名',
    sendCoinsButton: '汇出币',
    share: '分享',
    showQRCodeButton: '出示二维（QR）码',
  },
  contactList: {
    cancel: '取消',
    noContacts: '无联系人',
    noContactsDesc1: '无联系人显示。 \n  点击',
    noContactsDesc2: '以添加首位联系人。',
    noResults: '无结果',
    screenTitle: '地址簿',
    search: '查询',
  },
  electrumServer: {
    connectionError: '无法连接提供的 Electrum 浏览器',
    description: '您可以更改您的应用连接的服务器地址。推荐使用默认地址。',
    header: 'Electrum 服务器',
    host: '主机',
    port: '端口',
    save: '保存',
    successfullSave: '已成功保存更改。重启后，更改方可生效。',
    title: '更改 electrum 服务器',
    useDefault: '使用默认设置',
  },
  filterTransactions: {
    clearAll: '全部清除',
    clearFilters: '清除筛选设置',
    filter: '筛选设置',
    from: '汇款人',
    fromAmount: '最小金额',
    fromDate: '起始日期',
    header: '筛选交易',
    receive: '收到',
    received: '已收到',
    send: '发送',
    sent: '已发送',
    status: {
      canceled: '已取消',
      canceledDone: '取消——已完成',
      done: '完成',
      pending: '待处理',
    },
    to: '收款人',
    toAmount: '最大金额',
    toDate: '结束日期',
    transactionStatus: '交易状态',
    transactionType: '交易类型',
  },
  message: {
    allDone: '全部完成！',
    bePatient: '加载时请耐心等待。  可能需要一些时间。',
    cancelTxSuccess: '您已成功取消交易。\n  正在出币。',
    creatingAuthenticator: '正在创建验证器',
    creatingAuthenticatorDescription: '创建验证器时请耐心等待。\n  可能需要一些时间。',
    creatingWallet: '创建钱包',
    creatingWalletDescription: '创建钱包时请耐心等待。可能需要一些时间。',
    generateAddressesError: '无法生成地址',
    hooray: '太好了！',
    importingAuthenticator: '正在导入您的验证器',
    importingAuthenticatorDescription: '导入验证器时请耐心等待。\n  可能需要一些时间。',
    noTransactions: '在钱包中没有找到交易',
    noTransactionsDesc: '您可能正在尝试导入未曾用过的钱包',
    processing: '处理中',
    returnToAuthenticators: '返回验证器',
    returnToDashboard: '返回控制面板',
    returnToWalletChoose: '返回钱包类型选择',
    returnToWalletImport: '返回钱包导入',
    somethingWentWrong: '出问题了',
    somethingWentWrongWhileCreatingWallet: '钱包创建发生错误。请返回控制面板重新尝试。',
    success: '操作成功',
    successfullWalletDelete: '您的钱包已成功删除。您现在可以返回控制面板。',
    successfullWalletImport: '您的钱包已成功导入。您现在可以返回控制面板。',
    wrongMnemonic: '错误助记符',
    wrongMnemonicDesc: '助记符与任何受支持的钱包均不匹配。\n  您正在尝试导入无效助记键或未曾用过的钱包',
  },
  onboarding: {
    changePin: '更改 PIN',
    confirmNewPin: '确认新的 PIN',
    confirmPassword: '确认交易密码',
    confirmPin: '确认 PIN',
    createNewPin: '新的 PIN',
    createPassword: '创建交易密码',
    createPasswordDescription:
      '您的交易密码将用于验证所有交易。您之后将无法更改。交易密码必须包含至少 8 位字母数字字符。',
    createPin: '创建 PIN',
    createPinDescription: '您的 PIN 将用于登录应用。您之后可在设置一栏更改。',
    currentPin: '现用 PIN',
    failedTimes: '失败次数',
    failedTimesErrorInfo: '三次尝试不成功后，将阻止输入',
    goBack: '返回',
    minutes: '分钟。',
    numberOfAttemptsExceeded: '尝试次数超过',
    onboarding: '初始设置',
    passwordDoesNotMatch: '密码不匹配，请输入有效的密码。',
    pin: 'PIN',
    pinDoesNotMatch: 'PIN 不匹配。请输入有效的 PIN。',
    seconds: '秒',
    successButton: '前往仪表盘',
    successButtonChangedPin: '返回设置',
    successDescription: '好极了！\n  您已经成功创建了您的 PIN。',
    successDescriptionChangedPin: '好极了！\n  您已经成功修改了您的 PIN。',
    tryAgain: '稍后再试',
  },
  receive: {
    details: {
      amount: '金额',
      receiveWithAmount: '接收金额',
      receiveWithAmountSubtitle: '输入您想收到的金额。二维（QR）码会相应地更新以包含金额。',
      share: '分享',
      shareWalletAddress: '分享钱包地址',
    },
    header: '接收币',
    label: '钱包地址',
  },
  scanQrCode: {
    cancel: '取消',
    ok: '确认',
    permissionMessage: '我们需要获取相机使用权限',
    permissionTitle: '允许使用相机',
  },
  security: {
    jailBrokenPhone:
      '您的设备似乎越狱了。这可能会出现安全问题、死机或其它问题。我们不建议在已越狱的设备上使用 GoldWallet。',
    noPinOrFingerprintSet: '您的设备未设置 PIN 密码或指纹登录。 不建议在不安全的设备上使用 GoldWallet。',
    rootedPhone:
      '您的设备似乎取得了 root 权限。这可能会出现安全问题、死机或其它问题。我们不建议在取得 root 权限的设备上使用 GoldWallet。',
    title: '安全问题',
  },
  selectLanguage: {
    alertDescription: '选择语言并重启应用程序？',
    cancel: '取消',
    confirm: '确认',
    confirmation: '确认',
    header: '语言',
    restartInfo: '重新选择一门新的语言后，请重启 GoldWallet 以使更改生效',
  },
  send: {
    confirm: {
      availableBalance: '交易后的可用余额',
      cancelNow: '马上取消',
      pendingBalance: '交易后的待用余额',
      sendNow: '立即汇出',
    },
    create: {
      amount: '金额',
      fee: '手续费',
      headerText: '当网络上存在大量未处理交易时 (>1500)，较高的手续费可加快您的交易处理速度。典型值为 1-500 sat/b',
      setTransactionFee: '设定交易手续费',
    },
    details: {
      address: '地址',
      address_field_is_not_valid: '地址字段无效',
      amount_field_is_not_valid: '金额字段无效',
      amount_placeholder: '汇款金额（比特币 Vault）',
      cancel: '取消',
      create: '创建发票',
      create_tx_error: '交易创建出现错误。请确保地址有效。',
      fee: '手续费：',
      fee_field_is_not_valid: '手续费字段无效',
      fee_placeholder: '加上交易手续费（比特币 Vault）',
      feeUnit: 'Sat/B',
      next: '下一个',
      note: '备注（可选）',
      note_placeholder: '自我备注',
      remaining_balance: '余额',
      scan: '扫描',
      send: '汇款',
      title: '创建交易',
      to: '到',
      total_exceeds_balance: '汇出额超出可用余额。',
    },
    error: {
      description: '创建交易之前，必须首先添加比特币 Vault 钱包。',
      title: '错误',
    },
    header: '汇出币',
    recovery: {
      confirmFirstSeed: '确认取消助记词',
      confirmFirstSeedDesc: '打开创建钱包时生成的首个 PDF 文件，并按照相同顺序写下私钥助记词。',
      confirmSecondSeed: '确认快速助记词',
      confirmSecondSeedDesc: '打开创建钱包时生成的第二个 PDF 文件，并按照相同顺序写下私钥助记词。',
      confirmSeed: '确认取消助记词',
      confirmSeedDesc: '打开创建钱包时生成的 PDF 文件，并按照相同顺序写下私钥助记词。',
      recover: '取消',
      useWalletAddress: '使用该钱包的地址',
    },
    success: {
      description: '太好了！您已成功完成交易。',
      done: '完成',
      return: '返回控制面板',
      title: '操作成功',
    },
    transaction: {
      alert: '安全',
      alertDesc: '要确认该交易需要 144 个区块或大约 24 小时。您可以在该时间段内取消。',
      fastSuccess: '您已成功完成快速交易。',
      instant: '快速',
      instantDesc: '该交易将立即得到确认。谨慎使用。',
      lightningError: '该地址似乎用于 Lighting 发票。请转到 Lighting 钱包，支付该发票。',
      scanInstantKeyDesc: '打开创建钱包时生成的 PDF 文件，并扫描私钥二维（QR）码，以发送交易。',
      scanInstantKeyTitle: '扫描快速键',
      type: '交易类型',
      watchOnlyError: '仅查看钱包不能发送交易',
    },
    warning: '警告: ',
    warningGeneral:
      '请注意，在使用安全交易功能的过程中，您钱包中剩余的部分资金可能会被冻结。 这是与 UTXO 和比特币 Vault 钱包的区块链参数的常规过程。 当交易通过验证（大约 24 小时后）或交易被取消（24 小时内）后，资金冻结将被解除。',
  },
  settings: {
    about: '关于',
    aboutUs: '关于我们',
    advancedOptions: '高级选项',
    Biometrics: '允许生物识别',
    changePin: '更改 PIN',
    electrumServer: 'Electrum 服务器',
    FaceID: '允许FaceID 面部识别',
    fingerprintLogin: '指纹登录',
    general: '通用',
    header: '设置',
    language: '语言',
    notSupportedFingerPrint: '您的设备不支持指纹识别',
    security: '安全',
    TouchID: '允许指纹识别',
  },
  tabNavigator: {
    addressBook: '地址簿',
    authenticators: '验证器',
    settings: '设置',
    wallets: '钱包',
  },
  timeCounter: {
    closeTheApp: '关闭应用程序',
    description: '因为登录尝试失败，您的应用程序已被阻止。请等待必要的时间，以便重试。',
    title: '被阻止的应用程序',
    tryAgain: '重试',
  },
  transactions: {
    details: {
      addNote: '添加备注',
      addToAddressBook: '添加至地址簿',
      amount: '金额',
      blocked: '锁定',
      bytes: '字节',
      confirmations: '确认',
      copy: '复制',
      copyAndBoriadcast: '稍后复制和发送',
      details: '详情',
      detailTitle: '交易详情',
      fee: '手续费',
      from: '从',
      inputs: '输入',
      noLabel: '无标签',
      note: '备注',
      numberOfCancelTransactions: '取消交易的数量',
      ouputs: '输出',
      returnedFee: '返还费用：',
      satoshiPerByte: '每字节聪',
      sendCoins: '汇出币',
      timePending: '待定时间',
      title: '交易',
      to: '到',
      toExternalWallet: '至外部钱包',
      toInternalWallet: '至内部钱包',
      totalReturnedFee: '总返还费用：',
      transactioFee: '交易费',
      transactionDetails: '交易详情',
      transactionHex: '十六进制字符串交易标识符',
      transactionHexDescription: '这是十六进制字符串交易标识符，已签名并准备发送到网络',
      transactionId: '交易 ID',
      transactionType: '交易类型',
      txSize: '交易大小',
      unblocked: '未锁定',
      verify: '在 coinb.in 上验证',
      viewInBlockRxplorer: '在区块浏览器中查看',
      walletType: '钱包类型',
    },
    errors: {
      notEnoughBalance: '余额不足，请尝试发送较小的金额。',
    },
    label: {
      blocked: '锁定',
      canceled: '已取消',
      canceledDone: '取消——已完成',
      done: '完成',
      pending: '待定',
      unblocked: '未锁定',
    },
    list: {
      conf: '确认',
    },
    transactionTypeLabel: {
      canceled: '已取消',
      secure: '安全',
      secureFast: '快速安全',
      standard: '标准',
    },
  },
  unlock: {
    confirmButton: '确认指纹以继续。',
    enter: '输入 PIN',
    title: '解锁',
    touchID: 'Touch ID用于“Gold Wallet”',
  },
  unlockTransaction: {
    description: '输入交易密码以便进行交易。',
    headerText: '确认交易',
    title: '确认交易',
  },
  wallets: {
    add: {
      addWalletButton: '添加新的钱包',
      advancedOptions: '高级选项',
      air: '执行“标准、取消与快速”交易。',
      ar: '执行“标准与取消”交易。',
      description: '请为您的新钱包输入名称。',
      failed: '未能创建钱包',
      importWalletButton: '导入钱包',
      inputLabel: '名称',
      legacy: '执行默认类型的交易。',
      legacyHDP2SH: '它包含一系列由单一的 12 词种子生成的 P2SH 地址',
      legacyHDP2SHTitle: '标准 HD P2SH',
      LegacyHDSegWit: '它包含一系列由单一的 12 词种子生成的本地 segwit 地址',
      legacyHDSegWitTitle: '标准 HD SegWit',
      LegacyP2SH: '它包含单个 P2SH 地址',
      legacyP2SHTitle: '标准 P2SH',
      legacyTitle: '标准',
      multipleAddresses: '多个地址',
      publicKeyError: '所提供的公钥无效',
      segwidAddress: '它包含一系列的由单一的 12 词种子生成的本地 segwit 地址',
      singleAddress: '它包含单个 P2SH 地址',
      subtitle: '命名您的钱包',
      title: '添加新的钱包',
      walletType: '钱包类型',
    },
    addSuccess: {
      description:
        '您的钱包已创建。请花费一点时间在纸上写下这个助记词。这是您的备份。您可以在其它设备上使用备份来恢复钱包。',
      okButton: '好的，我写完了！',
      subtitle: '您的钱包已完成！\n 您已经创建了您的地址！',
      title: '添加新的钱包',
    },
    dashboard: {
      allWallets: '所有钱包',
      availableBalance: '可用余额',
      noTransactions: '无交易显示。',
      noWallets: '无钱包',
      noWalletsDesc1: '无钱包显示。',
      noWalletsDesc2: '添加首个钱包。',
      receive: '接收',
      recover: '取消',
      send: '汇出',
      title: '钱包',
      wallet: '钱包',
    },
    deleteWallet: {
      description1: '是否确认删除',
      description2: '？删除后无法撤销。',
      header: '删除钱包',
      no: '否',
      title: '删除您的钱包',
      yes: '是',
    },
    details: {
      deleteWallet: '删除钱包',
      details: '详情',
      edit: '编辑',
      exportWallet: '导出钱包',
      latestTransaction: '最新交易',
      nameEdit: '编辑名称',
      nameLabel: '名称',
      showWalletXPUB: '显示钱包扩展公钥 (XPUB)',
      typeLabel: '类型',
    },
    errors: {
      duplicatedPublicKey: '该公钥已添加',
      invalidMnemonic: '无效助记符',
      invalidMnemonicWordsNumber: '所提供的 {receivedWordsNumber} 个词预计为 {expectedWordsNumber} 个',
      invalidPrivateKey: '无效私钥',
      invalidPublicKey: '无效公钥',
      invalidQrCode: '无效二维（QR）码',
      invalidSign: '无法进行交易签名',
      noIndexForWord: '找不到以下单词的索引：{word}',
      wrongNetwork: `当应用程序网络是{appNetworkName}时，您在网络{walletNetworkName}上有钱包。请通过电报（Telegram）与我们的支持团队联系`,
    },
    export: {
      title: '钱包导出',
    },
    exportWallet: {
      header: '导出钱包',
      title: '助记词',
    },
    exportWalletXpub: {
      header: '钱包扩展公钥 (XPUB)',
    },
    import: {
      do_import: '导入',
      error: '导入失败。请确认提供的数据有效。',
      explanation: '请在此处写下您的助记符、私钥、WIF等。GoldWallet 会尽力猜测正确的格式并导入您的钱包',
      imported: '已导入',
      scan_qr: '或扫描二维（QR）码？',
      success: '操作成功',
      title: '导入',
    },
    importWallet: {
      chooseTypeDescription: '选择想要导入的钱包类型。',
      customWords: '自定义词语',
      extendWithCustomWords: '用自定义词语扩展这个种子',
      header: '导入钱包',
      import: '导入',
      importARDescription1: '输入助记词',
      importARDescription2: '扫描想要导入的钱包二维（QR）码',
      placeholder: '助记词',
      scanCancelPubKey: '扫描取消键二维（QR）码',
      scanFastPubKey: '扫描快速键二维（QR）码',
      scanPublicKeyDescription: '打开创建想要导入的钱包时生成的首个 PDF 文件，并使用该应用程序扫描公钥二维（QR）码。',
      scanQrCode: '或扫描二维（QR）码',
      scanWalletAddress: '扫描钱包地址',
      scanWalletAddressDescription: '扫描公用地址二维（QR）码，以开始与 GoldWallet 整合。',
      subtitle: '请在此处写下您的助记符、WIF 或者私钥等。GoldWallet 会尽力猜测正确的格式并导入您的钱包。',
      title: '导入您的钱包',
      unsupportedElectrumVaultMnemonic: '该种子来自 Electrum Vault，目前不受支持。不久将获得支持。',
      walletInUseValidationError: '钱包已使用。请输入有效的钱包。',
      allWalletsValidationError: '您不能输入名称“所有钱包”',
    },
    publicKey: {
      instantDescription:
        '转到另一设备上的 web 密钥生成器，并使用该应用程序扫描公钥二维（QR）码。记得将密钥导出为 PDF！',
      instantSubtitle: '添加快速键',
      recoveryDescription:
        '转到另一设备上的 web 密钥生成器，并使用该应用程序扫描公钥二维（QR）码。记得将密钥导出为 PDF！',
      recoverySubtitle: '添加取消键',
      scan: '扫描',
      webKeyGenerator: 'Web 密钥生成器：',
    },
    scanQrWif: {
      bad_password: '密码错误',
      bad_wif: 'WIF 错误',
      cancel: '取消',
      decoding: '解码',
      go_back: '返回',
      imported_legacy: '已导入 Legacy',
      imported_segwit: '已导入 SegWit',
      imported_watchonly: '已导入 Watch-only 监视钱包',
      imported_wif: '已导入 WIF',
      input_password: '输入密码',
      password_explain: '这是 BIP38 加密的私钥',
      wallet_already_exists: '此钱包已存在',
      with_address: '和地址',
    },
    wallet: {
      latest: '最新交易',
      none: '无',
      pendingBalance: '锁定余额',
    },
    walletModal: {
      btcv: 'BTCV',
      wallets: '钱包',
    },
  },
  connectionIssue: {
    noInternetTitle: '互联网未连接',
    noInternetDescription: '确保WI-FI或移动数据已打开，然后重试',
    offlineMessageTitle: '您处于离线状态',
    offlineMessageDescription: '连接到互联网以继续使用这些功能。',
    offlineMessageDescription2: '连接到互联网以继续使用这些功能。',
    noNetworkTitle: '无网络',
    noNetworkDescription: '您的互联网运行正常，但是您没有成功连接到网络。 请等待几分钟，然后重试。',
  },
};
