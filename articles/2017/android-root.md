
# android root

[TOC]

[TAG:android,root]
### root的好处

**root** 之后你才是手机真正的主人～，本来不能删的预装软件现在可以删了（不过我一般不删，怕真的把系统给弄崩了). 可以更高效地使用像greenify，icebox(必须root)这类需要root权限的软件.当然,root了之后还有其他各种与以往不同的玩法．


### nexus5x 的root过程



#### 解锁~

首先,要解锁,（解密解锁都是android的保护机制,不解锁就刷不了recovery,而一般的root过程就是通过recovery往系统里装一个superSU的程序，所以必须一步一步来，先解锁，然后刷recovery,再通过recovery刷superSU的包),关机状态下按住开机和音量下键可以进入fastboot模式．可以看到显示的画面里底部显示状态为locked(也就是被锁的状态).原则上这个时候需要在命令行下执行 fastboot oem unlock 就可以解锁了．感觉上很简单，就是需要连接一下电脑，然后执行一条命令．(.^.)不过，需要注意的在电脑上执行fastboot命令时需要该fastboot能识别出nexus5x.本来下了个linux版的fastboot，可是无法识别出已经连接的设备；恩，无奈最后换成windows10，按照这个链接 [root ](http://www.teamandroid.com/2016/09/08/root-nexus-5x-android-7-0-nrd90s-nougat-security-update/)的指示安好了驱动（在这个过程中我是下载了android sdk,里面的extra有google的通用设备驱动,然后更新安装设备管理器里的驱动)，fastboot终于能识别手机了．在之前所说的fastboot模式下,通过数据线连上电脑．然后打开命令行，执行 fastboot oem unclock (注意此时如果执行fastboot devices应该是可以看到设备的，看不到就是驱动没装好)



#### 刷Recovery

这个过程我想说三点：

- twrp和cwm以及后面的superSU都要从官网下！！！！官网！！！这里给个 [twrp](https://twrp.me/Devices/) 的官网链接.

- 刷完recovery之后直接就要把superSU刷进去，所以事先要把superSU.zip放在手机里面一个明显的地方.
- 最后下个twrp 或者 cwm　recovery然后通过之前的fastboot 执行 fastboot flash recovery \*\*.img 就可以了(手机处于fastboot模式下)


#### 刷superSU

按音量键切换到recovery模式下,或是刷入，或是安装,选择之前的superSU.zip，然后应该就算是root成功了(开机之后系统会多一个superSU软件)

