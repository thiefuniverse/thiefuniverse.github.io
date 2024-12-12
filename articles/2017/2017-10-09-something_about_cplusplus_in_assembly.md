
# assembly in C++

[TOC]


[TAG:assembly,C++]

### 前言

  最近想补习一下操作系统，了解到有许多可以自己实现操作系统的好方法，比如说有JOS或者清华的ucore系统。其实也不是
从头开始实现系统了，不过会参与实现操作系统的重要组成部分，了解到和操作系统底层相关的各种底层知识。其间我自己还补习
了一下汇编方面的知识，看了一本 [pcasm book](http://pacman128.github.io/pcasm/), 了解到关于C++的许多汇编层面的实现原理（有一本 Inside C++ object model
里面实际上也提到了许多）


### C++ 的函数重载

  C语言是不支持函数重载的，而C++可以。关键就在于编译器在编译C++的函数的时候，会把它的参数信息也追加作为标识符。比如说
编译器在处理这个函数时:

    void f( int x, int y, double z) ;    // => 汇编的函数label "可能为" _f_Fiid

    void f(double x, double y, int z);   // => 汇编的函数label "可能为" _f_Fddi

之所以说汇编的label"『可能』为"是由于不同的编译器的实现可能是不一样的。对于C语言，汇编生成的label都是f,所以会产生编译错误。
这里给出一个例子:
``` C++
    // test_overload_fun.cpp
    // for assembly code:   g++ -S test_overload_fun.cpp
    #include <iostream>
    
     int f(int a, int b, double c){
         return a+b;
     }
    
     int f(double a, double b, int c){
         return c;
     }
     int main (){
         std::cout<< f(3,4,4.5)<< std::endl;
         std::cout<< f(4.6, 3.6,5)<< std::endl;
    
     }
```

使用g++编译得到的汇编代码里可以大致看到两个函数的label名:


### C++ 的引用

从汇编代码可以明显看出来，引用实际本质上就是指针。
``` C++
    #include <iostream>
    
    int byref(int & foo)
    {
      return foo;
    }
    int byptr(int * foo)
    {
      return *foo;
    }
    
    int main(int argc, char **argv) {
      int aFoo = 5; 
    std::cout<< byref(aFoo)<< std::endl;
    
      std::cout<< byptr(&aFoo)<< std::endl;
    }

```

Mac下汇编得到的两个函数代码分别是:
``` asm
    __Z5byptrPi:                            ## @_Z5byptrPi
         .cfi_startproc
    ## BB#0:
         pushq	%rbp
    Lcfi3:
         .cfi_def_cfa_offset 16
    Lcfi4:
         .cfi_offset %rbp, -16
         movq	%rsp, %rbp
    Lcfi5:
         .cfi_def_cfa_register %rbp
         movq	%rdi, -8(%rbp)
         movq	-8(%rbp), %rdi
         movl	(%rdi), %eax
         popq	%rbp
         retq
         .cfi_endproc
    
         .globl	_main
         .p2align	4, 0x90

    __Z5byrefRi:                            ## @_Z5byrefRi
         .cfi_startproc
    ## BB#0:
         pushq	%rbp
    Lcfi0:
         .cfi_def_cfa_offset 16
    Lcfi1:
         .cfi_offset %rbp, -16
         movq	%rsp, %rbp
    Lcfi2:
         .cfi_def_cfa_register %rbp
         movq	%rdi, -8(%rbp)
         movq	-8(%rbp), %rdi
         movl	(%rdi), %eax
         popq	%rbp
         retq
         .cfi_endproc
    
         .globl	__Z5byptrPi
         .p2align	4, 0x90
```

两个函数的汇编代码可以说完全一样。


### C++ 内联函数

我们知道C++的内联函数在编译阶段会直接被替换成具体的函数内语句，这一点从汇编代码上也可以明显看出来。


### C++继承和多态

   首先我们要知道，C++的类的成员函数在编译时会默认添加第一个参数，即this指针。这个参数对我们是隐式存在的，
我们在调用某个对象的成员函数时，实际上把对象自身的地址作为this指针传入了成员函数中。（此处说明的只是C++的
一种实现方式，或者说是编译器的一种实现方式）

    我们知道C++的多态是通过虚函数来实现的, 含有虚函数的类实例就会存在一个虚函数表指针，指向虚函数的集合。
如果有继承类overwrite某个虚函数，子类的虚函数表会相应地更新。这样的话，即使父类指针指向子类实例，也能通过
已经实现覆盖更新过的虚函数表准确地调用对应的函数。

送上一段代码，可以用来测试虚函数表的实际工作过程(测试在ubuntu 16.04下可编译通过并运行).

``` C++
    #include <iostream>
    using namespace std;
    
    class A{
    public:
        virtual void   m1() {
            std::cout<< " A: m1()"<< std::endl;
        }
        virtual void m2(){
            std::cout<<" A: m2()"<< std::endl;
        }
        int ad;
    };
    
    class B: public A{
    public:
        virtual void m1() {
            std::cout<< " B::m1()"<< std::endl;
        }
        int bd;
    };
    
    void print_vtable(A *pa){
        unsigned * p = reinterpret_cast<unsigned*>(pa);
        void **vt = reinterpret_cast<void **> (p[0]);
        std::cout<< std::hex<< "vtable address: "<<vt<< std::endl;
    
        for(int i=0; i< 2; i++){
            std::cout<< "dword "<<i<<":"<<vt[i]<< std::endl;
       }
    
        void (*m1func_pointer)(A*);
        m1func_pointer = reinterpret_cast<void (*)(A*)> (vt[0]);
        m1func_pointer(pa);
    
        void (*m2func_pointer)(A*);
        m2func_pointer = reinterpret_cast<void (*)(A*)> (vt[1]);
        m2func_pointer(pa);
    
    }
    
    int main (){
        A a;
        B b1, b2;
        std::cout<< "a:"<< std::endl;
        print_vtable(&a);
    
        std::cout<< "b1:"<< std::endl;
        print_vtable(&b1);
    
        std::cout<< "b2:"<< std::endl;
        print_vtable(&b2);
    
    
    
    }
```

输出为:
``` C
    a:
    vtable address: 0x400f88
    dword 0:0x400dc8
    dword 1:0x400df4
     A: m1()
     A: m2()
    b1:
    vtable address: 0x400f68
    dword 0:0x400e20
    dword 1:0x400df4
     B::m1()
     A: m2()
    b2:
    vtable address: 0x400f68
    dword 0:0x400e20
    dword 1:0x400df4
     B::m1()
     A: m2()
```

易知继承之后的B类中虚函数表重写了m1的指针。