# Third-party notices / 第三方素材声明

本仓库的 **代码**（HTML/CSS/JavaScript、构建脚本、QA 脚本、Three.js 转换脚本和文档）以 MIT License 发布，见 `LICENSE`。

## 1. Three.js

- `vendor/three.js` 为 Three.js r170 的经典脚本构建。
- Three.js 由 three.js authors 开发，MIT License。
- 上游：https://github.com/mrdoob/three.js

## 2. 演示用品牌与产品素材（不由 MIT 覆盖）

以下文件/内嵌副本是为了复现本演示而加入的第三方视觉素材，**不属于 MIT 授权范围**；相关商标、角色、壁纸和产品图的权利归各自所有者：

- `assets/screen-lock.jpg` / `js/screen-image.js`
  - 用户提供的 Xiaomi 15 前面板/锁屏演示图。
- `assets/logo-wordmark.png` / `js/logo-image.js`
  - 用户提供的 `XIAOMI` 字标图（去背版本）。
- `assets/chip-snapdragon.png` / `js/chip-image.js`
  - 用户提供的 Snapdragon 8 Elite 贴纸图。
- `preview*.png`
  - 本项目的渲染预览图，包含上述商标与产品外观。

Xiaomi、Xiaomi 15、Leica、VARIO-SUMMILUX、Snapdragon、Qualcomm 等名称和标识是其各自所有者的商标。本项目与小米、徕卡、高通没有关联，也未获其背书。

**若要再分发或商用**，请先确认你拥有这些图片的使用权。没有授权时，请删除上述图片与对应的 `js/*-image.js` 文件；页面会回退到程序化生成的占位屏幕/字标/芯片贴图（代码仍可运行）。更彻底的做法是把素材替换为自制的无商标图片。

## 3. 参数与参考资料

机型参数整理自小米官网 Xiaomi 15 参数页：

- https://www.mi.com/prod/xiaomi-15/specs

芯片性能数据来自用户提供的 Snapdragon 8 Elite 宣传图（CPU/GPU/AI 提升和功耗数据）。参数事实本身不主张版权，但请保留来源说明。

## 4. 开发依赖

- `playwright-core`（仅开发/QA，Apache-2.0）不随页面分发。
- 运行时不依赖 npm 包；`vendor/three.js` 已本地化。
