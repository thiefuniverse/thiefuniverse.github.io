
# Table of Contents

1.  [lightdm的使用](#org685e2d9)
2.  [输入法无法切换和应用字体出现空格](#orgb5e6d8b)
3.  [安装kde-base及相关依赖包](#orgcc6cb95)
4.  [进入不了kde桌面](#org0559e8a)



<a id="org685e2d9"></a>

# lightdm的使用

  /etc/lightdm/lightdm.conf是主体配置文件,可以把greet－xsession设置成自己想要的
greeter.有不同的登录界面可以选择,比如lightdm-gtk-greeter,lightdm-webkit(2)-greeter,
试了半天发现webkit2这个主题比较酷炫的greeter并不能用,感到很无奈,只好用着lightdm-gtk-greeter.
当然这个gtk的登录界面也可以进行简单配置的.


<a id="orgb5e6d8b"></a>

# 输入法无法切换和应用字体出现空格

  输入法无法切换这一点纠结了我很久,之前一直用的ubuntu下的搜狗输入法,现在也仍装了它.
arch下安装软件还是比较方便的,但是一直切换不出来搜狗输入法让人很无奈,搜了半天最后发
现似乎是在配置文件里加入

    export LANG=zh_CN.UTF-8
    export LANGUAGE=zh_CN:en_US
    export LC_CTYPE=en_US.UTF-8
    
    export XIM="fcitx"
    export XIM_PROGRAM="fcitx"
    export XMODIFIERS="@im=fcitx"ｄ
    export GTK_IM_MODULE="fcitx"
    export QT_IM_MODULE="fcitx"

这些配置,然而,也不知道该加入哪个配置文件,/etc/locale.conf,~/.xinitrc,~/.xprofile,
/etc/environment都加了最后不知怎么就可以调用了,只是同时也发现clion乱码了,很失望:(

至于乱码是怎么解决的呢?


<a id="orgcc6cb95"></a>

# 安装kde-base及相关依赖包

 安装了kde的字体工具,基本的字体文件之后,一看发现之前有空格的应用现在都正常了.  :)
不得不说kde这个系列还是很不错的,只是电脑性能太差了,很容易卡.


<a id="org0559e8a"></a>

# 进入不了kde桌面

  看archwiki上说kde5用sddm比较好的意思(也可能是我理解错了),最后偶然把lightdmf关了,换成
了gdm,竟然一下可以进入plasma界面了.恩,然后体验了一把gnome和kde的卡,对比了一下发现了我
xfce的流畅简洁.    :)

