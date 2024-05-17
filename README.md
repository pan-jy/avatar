<h1 align="center">基于视觉骨架提取的虚拟形象演播软件</h1>

<div align="center">
<img src="https://github.com/pan-jy/avatar/blob/master/resources/icon.png" height="128px" width="128px">
</div>
  
<h1 align="center">AVATAR</h1>

## 介绍

本项目的目标在于利用普通的视频素材或摄像头以及较低的硬件配置要求，即可使用虚拟形象进行直播。主要工作是采用 `BlazePose GHUM Holistic` 算法来提取人体骨架的坐标信息，通过运动学求解器（[`kalidokit`](https://github.com/yeemachine/kalidokit)）将骨骼坐标转为骨骼的旋转信息并实时驱动虚拟形象。最后结合 `Three.js` 实时渲染3D场景及虚拟形象，并且采用了 `WebRTC` 配合 `WebSocket` 进行实时场景的转发。使系统可以与 OBS 等软件相结合应用于直播、动画制作等领域。

## 主要模块

- 虚拟形象管理
- 场景管理
- 动作捕捉 & 驱动虚拟形象
- 媒体流转发
- 系统设置

## 系统架构

<div align="center">
<img src="https://github.com/pan-jy/avatar/blob/master/resources/system.png" width="554px" height="457px" />
</div>

## Project Setup

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```
