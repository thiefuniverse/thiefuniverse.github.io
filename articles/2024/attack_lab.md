# csapp 缓冲区溢出攻击

[TOC]

[TIME:2024-12-19]
[TAG:assembly]

## 介绍
csapp 实验题中的 [attack bomb](https://csapp.cs.cmu.edu/3e/labs.html),该实验给了两个接受标准输入的程序，利用程序存在的缓冲区溢出漏洞和返回值优化漏洞,通过给指定的输入内容,改变程序正常的运行逻辑，实现对程序的攻击。


## level 1
第一题介绍是说让getbuf调用返回之后，不进行后续操作，直接调用touch1函数。gdb跑起来目标程序(ctarget),反汇编看下test和getbuf的实现。
![disassembly for test/getbuf](attack_lab/1.png)
可以看到反汇编的逻辑和handout中描述的代码是基本一致的，这里从getbuf的反汇编中，看到rsp寄存器减去了0x28（40个字节），一般来说，应该是从栈上分配了40个字节的内存给局部变量，对应代码中的BUFFERSIZE，之后将rsp赋值给rdi，作为Gets的参数来接收数据。
之后我还看了下Gets的反汇编，但是想了想，Gets本身的作用是读取数据存储到buf，要想实现getbuf返回之后不继续执行原有逻辑，则需要在Gets读取的时候，让溢出数据覆盖栈上get_buf的返回地址，通过改变返回地址，改变ip寄存器的行为。

也就是说我们需要把test函数中rsp+8的位置覆盖成touch1函数的地址，使得getbuf 返回之后，跳转到返回地址时进入touch1中执行。
我们先观察一下缓冲区不溢出时栈上的数据表现，




