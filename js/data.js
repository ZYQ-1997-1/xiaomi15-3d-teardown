/* =========================================================================
   Xiaomi 15 · 3D Teardown Lab
   data.js — official product data + part metadata (UI/labels are driven here)

   Source: Xiaomi official Xiaomi 15 parameter page
   https://www.mi.com/prod/xiaomi-15/specs
   ========================================================================= */
(function () {
  'use strict';

  const XM15 = (window.XM15 = window.XM15 || {});

  /* Official reference: 152.3 × 71.2 × 8.08 mm (glass), 191 g.
     Scene unit = 1 cm. The 3D structure itself is an artistic reconstruction. */
  XM15.PHONE = {
    width: 7.12,
    height: 15.23,
    depth: 0.808,
    radius: 1.05,
  };

  XM15.PRODUCT = {
    name: 'Xiaomi 15',
    cn: '小米 15',
    year: '2024',
    tagline: '小屏旗舰 · 结构全解析',
    intro:
      '6.36 英寸 1.5K 低功耗超级阳光屏、5400mAh 小米金沙江电池、' +
      '骁龙 8 至尊版与徕卡光学 Summilux 三摄。本页依据小米官网参数，' +
      '用纯代码重建整机结构，点击任意部件即可拆解并查看参数。',
    specs: [
      { k: '处理器', v: '骁龙 8 至尊版', s: '台积电第二代 3nm' },
      { k: '屏幕', v: '6.36″ 1.5K', s: '3200nits · 120Hz' },
      { k: '影像', v: '徕卡三摄', s: '50MP × 3 · Summilux' },
      { k: '电池', v: '5400mAh', s: '90W 有线 · 50W 无线' },
      { k: '机身', v: '191g / 8.08mm', s: '152.3 × 71.2mm' },
      { k: '防护', v: 'IP68', s: '3D 超声波指纹' },
    ],
    official: {
      source: 'https://www.mi.com/prod/xiaomi-15/specs',
      sourceLabel: '小米官网 Xiaomi 15 参数页',
      updated: '2024.10',
      sections: [
        {
          title: '外观尺寸',
          rows: [
            ['长度', '152.3mm'],
            ['宽度', '71.2mm'],
            ['厚度', '8.08mm（玻璃版）｜8.48mm（亮银版）｜8.36mm（钻石限定版）'],
            ['重量', '191g（玻璃版）｜192g（亮银版）｜189g（钻石限定版）'],
            ['颜色', '黑色 / 白色 / 丁香紫 / 浅草绿 / 亮银版'],
            ['限定版', '冰川白 / 大象灰 / 橙色（钻石限定版）'],
          ],
        },
        {
          title: '移动平台',
          rows: [
            ['平台', '骁龙 8 至尊版移动平台'],
            ['工艺', '台积电第二代 3nm 制程'],
            ['CPU', '八核处理器，最高主频 4.32GHz'],
            ['GPU', 'Adreno™ GPU'],
            ['AI', '高通 AI 引擎'],
          ],
        },
        {
          title: '内存与存储',
          rows: [
            ['运行内存', '12GB / 16GB LPDDR5X'],
            ['机身存储', '256GB / 512GB / 1TB UFS 4.0'],
            ['最高组合', '16GB + 1TB'],
          ],
        },
        {
          title: '屏幕显示',
          rows: [
            ['尺寸', '6.36 英寸'],
            ['类型', 'OLED 柔性直屏'],
            ['分辨率', '2670 × 1200（1.5K）'],
            ['刷新率', '最高 120Hz'],
            ['触控采样率', '最高 300Hz'],
            ['峰值亮度', '3200nits（多场景峰值）'],
            ['特性', '专业原色屏 / 全局 DC 调光 / DCI-P3 / 湿手触控'],
            ['盖板', '小米龙晶玻璃'],
          ],
        },
        {
          title: '影像系统',
          rows: [
            ['主摄', '5000万 光影猎人900 · ƒ/1.62 · 23mm · 7P · OIS · 2.4μm'],
            ['长焦', '5000万 徕卡浮动长焦 · ƒ/2.0 · 60mm · 6P · OIS · 5×无损变焦 · 10cm'],
            ['超广角', '5000万 · ƒ/2.2 · 14mm · 6P · 115° · EIS'],
            ['辅助', '模组约 43 × 43.5mm（占机身宽度约 60%） · 四开孔与玻璃齐平 · 红外/激光传感器（右上） · 模组内麦克风 · 右侧靠上独立闪光灯'],
            ['前置', '3200万高清相机 · 4K 60fps'],
            ['平台', 'Xiaomi AISP 大模型计算摄影平台 2.0'],
            ['视频', '8K 30fps / 4K 60fps'],
          ],
        },
        {
          title: '充电续航',
          rows: [
            ['电池容量', '5400mAh(typ) / 5260mAh(min)'],
            ['电芯', '单电芯高能量密度硅碳电池，不可拆卸'],
            ['有线充电', '90W 小米澎湃有线秒充'],
            ['无线充电', '50W 小米澎湃无线秒充'],
            ['反向充电', '支持无线反充'],
            ['快充协议', 'QC3+ / QC3.0 / QC2.0 / PD3.0 / PD2.0 / MI FC 2.0'],
          ],
        },
        {
          title: '网络与连接',
          rows: [
            ['网络', '5G 双卡双通 · 全网通 9.0'],
            ['WLAN', 'Wi-Fi 7 / Wi-Fi 6 增强版 / Wi-Fi 5'],
            ['蓝牙', 'Bluetooth 5.4 · Dual-Bluetooth'],
            ['数据接口', 'USB Type-C · USB 3.2 Gen1（最高 5Gbps）'],
            ['NFC', '多功能 NFC：交通卡 / Mi Pay / 门卡 / 车钥匙'],
            ['定位', '北斗 / GPS / Galileo / GLONASS / QZSS'],
          ],
        },
        {
          title: '音频与传感器',
          rows: [
            ['扬声器', '立体声双扬声器'],
            ['音频', '杜比全景声 / 空间音频 / Hi-Res 认证'],
            ['麦克风', '高动态 4-MIC 阵列'],
            ['指纹', '3D 超声波指纹'],
            ['马达', 'X 轴线性马达'],
            ['其他', '红外遥控 / 激光对焦 / 气压计 / 霍尔传感器'],
          ],
        },
        {
          title: '防护与系统',
          rows: [
            ['防护等级', 'IP68（IEC 60529，1.5m 清水 / 30 分钟）'],
            ['操作系统', 'Xiaomi HyperOS 2'],
          ],
        },
        {
          title: '包装清单',
          rows: [
            ['主机', 'Xiaomi 15'],
            ['充电器', '90W 电源适配器'],
            ['配件', 'USB-C 数据线 / 手机保护壳 / 出厂贴膜 / 插针 / 说明书（含三包凭证）'],
          ],
        },
      ],
    },
    disclaimer: '拆解结构为艺术化重建 · 参数引用自小米官网',
  };

  /* explode: [x, y, z] offset in scene units (cm) at full teardown
     anchor:   world-space point the floating label tracks
     offset:   label offset in CSS pixels from the projected anchor
     repair:   1 = easy … 5 = hard                                          */
  XM15.PARTS = [
    {
      id: 'screen',
      index: 1,
      name: '屏幕总成',
      en: '1.5K OLED DISPLAY ASSEMBLY',
      category: '显示',
      accent: '#45d8ff',
      tag: '6.36″ 1.5K · 120Hz',
      fixed: false,
      explode: [0, 0, 6.6],
      anchor: [-1.55, 5.6, 0.4],
      offset: [-40, -34],
      repair: 4,
      repairText: '高',
      specs: [
        { k: '尺寸 / 分辨率', v: '6.36″ · 2670 × 1200' },
        { k: '屏幕类型', v: 'OLED 柔性直屏' },
        { k: '刷新率', v: '最高 120Hz' },
        { k: '触控采样率', v: '最高 300Hz' },
        { k: '峰值亮度', v: '3200nits' },
        { k: '盖板玻璃', v: '小米龙晶玻璃' },
        { k: '指纹方案', v: '3D 超声波指纹' },
      ],
      desc:
        '6.36 英寸 1.5K 低功耗超级阳光屏，采用 OLED 柔性直屏与小米龙晶玻璃盖板，' +
        '支持 120Hz 刷新率、300Hz 触控采样率与 3200nits 多场景峰值亮度。' +
        '屏幕由中框胶圈与排线固定，是整机拆解的第一层。',
    },
    {
      id: 'frame',
      index: 2,
      name: '金属中框',
      en: 'ALUMINUM ALLOY FRAME',
      category: '结构',
      accent: '#8fa9c9',
      tag: '一体 CNC · 承载骨架',
      fixed: true,
      explode: [0, 0, 0],
      anchor: [3.58, -5.1, 0],
      offset: [80, 48],
      repair: 5,
      repairText: '极高',
      specs: [
        { k: '材质', v: '铝合金中框' },
        { k: '整机尺寸', v: '152.3 × 71.2 × 8.08mm' },
        { k: '整机重量', v: '191g（玻璃版）' },
        { k: '防护等级', v: 'IP68' },
        { k: '可选颜色', v: '黑 / 白 / 丁香紫 / 浅草绿 / 亮银版' },
      ],
      desc:
        '中框是整机的承载骨架，屏幕、主板、电池与后盖全部固定在它上面。' +
        '侧边集成音量键、电源键开孔，底部集成 USB-C、扬声器与 SIM 卡托开孔，' +
        '同时兼作天线辐射体，并布置多处注塑断点。',
    },
    {
      id: 'back',
      index: 3,
      name: '后盖玻璃',
      en: 'GLASS BACK COVER',
      category: '外观',
      accent: '#b8c5d4',
      tag: '3D 玻璃 · 50W 无线',
      fixed: false,
      explode: [1.5, -3.5, -5.5],
      rotateY: Math.PI,
      noOutline: true,
      anchor: [0, -5.9, -0.42],
      offset: [-36, 52],
      repair: 2,
      repairText: '低',
      specs: [
        { k: '材质', v: '3D 玻璃后盖' },
        { k: '表面工艺', v: '磨砂蚀刻 + 镀膜' },
        { k: '无线充电', v: '50W 小米澎湃无线秒充' },
        { k: '反向充电', v: '支持无线反充' },
        { k: '固定方式', v: '结构胶 + 卡扣' },
      ],
      desc:
        '3D 玻璃后盖，内侧贴附无线充电线圈与散热膜。' +
        '加热软化结构胶后，用吸盘与撬片即可沿中框分离，是拆解进入内部的第一道门。' +
        '玻璃版厚 8.08mm，亮银版 8.48mm。',
    },
    {
      id: 'camera',
      index: 4,
      name: '徕卡影像模组',
      en: 'LEICA VARIO-SUMMILUX MODULE',
      category: '影像',
      accent: '#ff7a3c',
      tag: '50MP × 3 · 5× 无损变焦',
      fixed: false,
      explode: [0.5, 2.2, -8.0],
      rotateY: Math.PI,
      anchor: [0.91, 4.59, -0.76],
      offset: [86, 78],
      repair: 3,
      repairText: '中',
      specs: [
        { k: '主摄', v: '5000万 光影猎人900 · ƒ/1.62 · 23mm · 7P · OIS' },
        { k: '长焦', v: '5000万 浮动长焦 · ƒ/2.0 · 60mm · 6P · OIS' },
        { k: '超广角', v: '5000万 · ƒ/2.2 · 14mm · 6P · 115° · EIS' },
        { k: '变焦', v: '5× 无损变焦 · 10cm 超级特写' },
        { k: '融合像素', v: '主摄 2.4μm 融合大像素' },
        { k: '模组尺寸', v: '约 43 × 43.5mm · 占机身宽度约 60%' },
        { k: '传感器', v: '红外 + 激光对焦（右上）' },
        { k: '闪光灯', v: '模组右侧靠上独立竖条' },
        { k: '麦克风', v: '模组正面开孔（左侧）' },
        { k: '前置', v: '3200万 · 支持 4K 60fps' },
        { k: '计算摄影', v: 'Xiaomi AISP 2.0' },
        { k: '视频', v: '8K 30fps / 4K 60fps' },
      ],
      desc:
        '徕卡光学 VARIO-SUMMILUX 三摄，四个圆形开孔与玻璃齐平、整块模组凸起：' +
        '5000万光影猎人900 主摄（ƒ/1.62、23mm、7P、OIS、2.4μm 融合大像素）、' +
        '5000万徕卡浮动长焦（ƒ/2.0、60mm、6P、OIS，5× 无损变焦与 10cm 特写）' +
        '与 5000万超广角（ƒ/2.2、14mm、6P、115°、EIS）。模组约 43 × 43.5mm，' +
        '在 71.2mm 宽的机身上占比约 60%；整块黑色玻璃与中框采用相同圆角，' +
        'LEICA 三行铭文按竖屏旋转 90°（横持手机正读），左侧带一个正面开孔麦克风。' +
        '右上角开孔为红外与激光对焦传感器，闪光灯则是模组右侧靠上的独立竖向灯条。',
    },
    {
      id: 'battery',
      index: 5,
      name: '电池',
      en: 'SILICON-CARBON BATTERY',
      category: '能源',
      accent: '#4ee6a8',
      tag: '5400mAh · 90W',
      fixed: false,
      explode: [0, -0.9, 3.35],
      anchor: [0, -1.2, 0.26],
      offset: [12, 26],
      repair: 2,
      repairText: '低',
      specs: [
        { k: '容量', v: '5400mAh(typ) / 5260mAh(min)' },
        { k: '电芯', v: '单电芯高能量密度硅碳电池' },
        { k: '有线充电', v: '90W 小米澎湃有线秒充' },
        { k: '无线充电', v: '50W 小米澎湃无线秒充' },
        { k: '反向充电', v: '支持无线反充' },
        { k: '快充协议', v: 'QC3+ / PD3.0 / MI FC 2.0 等' },
      ],
      desc:
        '5400mAh 小米金沙江电池，单电芯高能量密度硅碳方案，' +
        '支持 90W 小米澎湃有线秒充、50W 小米澎湃无线秒充与无线反充。' +
        '电池通过易拉胶固定在中框上，断开 BTB 后拉出底部易拉胶即可取下。',
    },
    {
      id: 'mainboard',
      index: 6,
      name: '主板',
      en: 'MAIN LOGIC BOARD',
      category: '核心',
      accent: '#45d8ff',
      tag: '骁龙 8 至尊版',
      fixed: false,
      explode: [-1.0, 3.0, -3.0],
      rotateY: Math.PI,
      anchor: [0, 5.45, -0.32],
      offset: [-104, -50],
      repair: 3,
      repairText: '中',
      specs: [
        { k: 'SoC', v: '骁龙 8 至尊版移动平台' },
        { k: '工艺', v: '台积电第二代 3nm' },
        { k: 'CPU', v: '八核 · 最高 4.32GHz' },
        { k: 'GPU', v: 'Adreno™ GPU' },
        { k: '内存', v: '12GB / 16GB LPDDR5X' },
        { k: '存储', v: '256GB / 512GB / 1TB UFS 4.0' },
      ],
      desc:
        '高集成度主板，搭载骁龙 8 至尊版移动平台（台积电第二代 3nm、八核最高 4.32GHz、Adreno GPU），' +
        '并集成 12/16GB LPDDR5X 内存与 256GB–1TB UFS 4.0 存储。' +
        'SoC 区域为独立封装插座，表面覆盖大面积射频屏蔽罩，小米翼型环形冷泵直接贴合 SoC 区域。',
    },
    {
      id: 'chip',
      index: 7,
      name: '骁龙 8 至尊版',
      en: 'SNAPDRAGON 8 ELITE',
      category: '核心',
      accent: '#ff6a3d',
      tag: '3nm · 双超大核',
      fixed: false,
      explode: [0.8, 2.2, 4.2],
      rotateY: Math.PI,
      anchor: [-0.85, 6.1, -0.39],
      offset: [76, 46],
      repair: 4,
      repairText: '高',
      specs: [
        { k: '平台', v: '骁龙 8 至尊版移动平台' },
        { k: '制程', v: '台积电第二代 3nm' },
        { k: 'CPU', v: '高通双超大核架构 · 八核' },
        { k: 'CPU 性能', v: '多核 +45% · 功耗 -52%' },
        { k: 'GPU 性能', v: '性能 +44% · 功耗 -46%' },
        { k: 'AI 性能', v: '性能 +105% · 能效 +45%' },
        { k: '内存', v: 'LPDDR5X 满血内存' },
        { k: '存储', v: 'UFS 4.0 · 读取 4GB/s' },
      ],
      desc:
        '骁龙 8 至尊版移动平台，采用台积电第二代 3nm 工艺与高通双超大核架构。' +
        '官方数据：CPU 多核性能 +45%、功耗 -52%；GPU 性能 +44%、功耗 -46%；' +
        'AI 性能 +105%、能效 +45%。平台搭配 LPDDR5X 满血内存与 UFS 4.0 存储，' +
        '独立封装在主板 SoC 插座上，可单独拆下查看芯片正面标识。',
    },
    {
      id: 'vc',
      index: 8,
      name: '翼型环形冷泵',
      en: 'WING-SHAPED RING VAPOR CHAMBER',
      category: '散热',
      accent: '#ffb15e',
      tag: '翼型环形冷泵',
      fixed: false,
      explode: [1.0, -0.6, -1.5],
      anchor: [0, 0.7, -0.26],
      offset: [104, 62],
      repair: 4,
      repairText: '高',
      specs: [
        { k: '类型', v: '小米翼型环形冷泵散热系统' },
        { k: '结构', v: '气液分离回路' },
        { k: '覆盖区域', v: 'SoC · 影像 · 充电 IC' },
        { k: '设计目标', v: '持续性能释放 · 控制机身温度' },
      ],
      desc:
        '小米翼型环形冷泵散热系统，将传统 VC 的平面腔体升级为立体回路：' +
        '液体在热源处汽化后沿独立通道回流，形成单向循环，' +
        '为骁龙 8 至尊版与影像模组持续导出热量。',
    },
    {
      id: 'coil',
      index: 9,
      name: '无线充电线圈',
      en: 'WIRELESS CHARGING COIL',
      category: '能源',
      accent: '#ffd166',
      tag: '50W 无线充电',
      fixed: false,
      explode: [0, 0, -3.9],
      anchor: [0, -0.85, -0.31],
      offset: [-104, 58],
      repair: 2,
      repairText: '低',
      specs: [
        { k: '无线充电', v: '50W 小米澎湃无线秒充' },
        { k: '反向充电', v: '支持无线反充' },
        { k: '结构', v: '多股利兹线密绕' },
        { k: '附加功能', v: 'NFC 天线 / 温度检测' },
      ],
      desc:
        '高密度利兹线线圈贴合在后盖内侧，配合双 NTC 温控与主板无线充电 IC 工作，' +
        '支持 50W 无线秒充与无线反充。线圈与 NFC 天线共用部分走线区域，拆后盖时需注意排线。',
    },
    {
      id: 'power',
      index: 10,
      name: '电源键',
      en: 'POWER BUTTON',
      category: '按键',
      accent: '#45d8ff',
      tag: '金属按键 · NFC 卡包',
      fixed: false,
      explode: [3.4, 0.3, 0.5],
      anchor: [3.68, 1.9, 0.0],
      offset: [96, 8],
      repair: 1,
      repairText: '极低',
      specs: [
        { k: '材质', v: '金属按键' },
        { k: '位置', v: '右侧边框' },
        { k: '功能', v: '电源 / 锁屏 / 唤醒' },
        { k: 'NFC', v: '双击唤起卡包' },
      ],
      desc:
        '电源键位于右侧边框，采用金属材质并独立于中框，' +
        '按压可完成电源、锁屏与唤醒。通过双击电源键可唤起 NFC 卡包，' +
        '使用交通卡、Mi Pay、门卡与车钥匙。',
    },
    {
      id: 'volume',
      index: 11,
      name: '音量键',
      en: 'VOLUME ROCKER',
      category: '按键',
      accent: '#45d8ff',
      tag: '一体式音量条',
      fixed: false,
      explode: [3.4, 1.2, -0.2],
      anchor: [3.68, 3.1, 0.0],
      offset: [96, -22],
      repair: 1,
      repairText: '极低',
      specs: [
        { k: '材质', v: '金属按键' },
        { k: '结构', v: '一体式音量条' },
        { k: '位置', v: '电源键上方' },
        { k: '功能', v: '音量 ± / 相机快门' },
      ],
      desc:
        '上下音量键共用一条金属音量条，内部通过微动开关与副板连接。' +
        '在相机界面中可自定义为快门键或变焦键。',
    },
    {
      id: 'usb',
      index: 12,
      name: 'USB-C 接口',
      en: 'USB TYPE-C PORT',
      category: '接口',
      accent: '#5eead4',
      tag: 'USB-C · 90W 快充',
      fixed: false,
      explode: [0, -4.6, 0.8],
      anchor: [0, -7.62, 0.0],
      offset: [-30, 104],
      repair: 3,
      repairText: '中',
      specs: [
        { k: '接口', v: 'USB Type-C 双面充电接口' },
        { k: '数据传输', v: 'USB 3.2 Gen1 · 最高 5Gbps' },
        { k: '有线充电', v: '90W 小米澎湃有线秒充' },
        { k: '快充协议', v: 'QC3+ / PD3.0 / MI FC 2.0 等' },
        { k: '固定', v: '焊接于底部副板' },
      ],
      desc:
        'USB Type-C 双面充电接口焊接在底部副板上，外圈配独立防水胶圈。' +
        '接口承担 90W 小米澎湃有线秒充与数据传输，支持 USB 3.2 Gen1（最高 5Gbps，' +
        '需搭配 USB 3 数据线），是整机使用频率最高的部件之一。',
    },
    {
      id: 'speaker',
      index: 13,
      name: '底部扬声器',
      en: 'BOTTOM SPEAKER',
      category: '声学',
      accent: '#f472b6',
      tag: '立体声双扬声器',
      fixed: false,
      explode: [2.1, -4.3, 0.6],
      anchor: [2.15, -7.4, -0.08],
      offset: [98, 88],
      repair: 2,
      repairText: '低',
      specs: [
        { k: '组合', v: '立体声双扬声器' },
        { k: '音效', v: '杜比全景声 / 空间音频' },
        { k: '认证', v: 'Hi-Res & Hi-Res Audio Wireless' },
        { k: '麦克风', v: '高动态 4-MIC 阵列' },
      ],
      desc:
        '底部扬声器与顶部听筒组成立体声双扬声器，支持杜比全景声与空间音频。' +
        '机身配备高动态 4-MIC 阵列，用于通话降噪与高清录音。' +
        '扬声器通过触点与底部副板连接，拆卸时需先移除底部副板。',
    },
    {
      id: 'earpiece',
      index: 14,
      name: '顶部听筒',
      en: 'EARPIECE SPEAKER',
      category: '声学',
      accent: '#f472b6',
      tag: '立体声高频单元',
      fixed: false,
      explode: [0, 4.2, 0.4],
      anchor: [0, 7.6, 0.07],
      offset: [-220, -100],
      repair: 2,
      repairText: '低',
      specs: [
        { k: '类型', v: '顶部听筒' },
        { k: '组合', v: '立体声双扬声器' },
        { k: '功能', v: '通话 / 高频单元' },
        { k: '麦克风', v: '高动态 4-MIC 阵列' },
      ],
      desc:
        '顶部听筒兼具高频扬声器角色，与底部扬声器共同组成立体声双扬声器。' +
        '内部配有防尘网与密封泡棉，拆解后需更换密封件以维持 IP68 防护。',
    },
    {
      id: 'sim',
      index: 15,
      name: 'SIM 卡托',
      en: 'SIM TRAY',
      category: '接口',
      accent: '#94a3b8',
      tag: '双 Nano-SIM',
      fixed: false,
      explode: [-3.5, -4.0, 0.5],
      anchor: [-2.35, -7.6, -0.02],
      offset: [-116, 72],
      repair: 1,
      repairText: '极低',
      specs: [
        { k: '类型', v: '双 Nano-SIM 卡槽' },
        { k: '网络', v: '5G 双卡双通 · 全网通 9.0' },
        { k: '位置', v: '机身底部' },
        { k: '防水', v: '红色硅胶密封圈' },
      ],
      desc:
        '双 Nano-SIM 卡托采用金属骨架与红色硅胶密封圈，插入中框底部卡槽，' +
        '支持 5G 双卡双通。卡托同时承担该开孔的防尘防水密封。',
    },
  ];
})();
