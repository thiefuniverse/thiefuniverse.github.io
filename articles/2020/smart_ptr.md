# 智能指针那些琐事儿

[TOC]

[TAG:C++]
[TIME:2020-5-4]

## 前言

经常用C++的智能指针,比起C语言野蛮地free,这简直就是大杀器;那么,今天我们来探探这个大杀器的底,看看到底这几个指针底层是如何实现相应功能的.

## 几个问题
C++11之前有个auto_ptr,它有什么用?和现在的智能指针有什么渊源吗?

shared_ptr是如何实现通过引用计数来自动释放资源的?计数的counter存在哪里?

weak_ptr有什么作用?它是如何对资源进行访问的,如果资源被释放了,它如何感知?

unique_ptr如何实现对单个资源所有权的管理?

希望读完这篇文章,你能弄明白这些问题，如果有不明白的欢迎在原文评论区或者公众号后台提问,互相交流学习.

## 功能和实现
### auto_ptr

看了下clang的这块的实现,感觉和unique_ptr有点像,赋值构造的之后会自动转移所有权到新的auto_ptr上.而对于unique_ptr来说需要明确用move转化成右值引用来进行构造.另外从标准要求的实现来看,unique_ptr对delete[]有支持.不深究这块了，是可以被unique_ptr取代的.

### shared_ptr

shared_ptr主要是通过引用计数，来实现对象资源的自动释放. 既然是计数，我们就需要有一个counter来记录我们正在使用中的 shared_ptr的个数.很容易理解应该有类似如下的一个class（后文我会称这个__shared_count为引用计数对象):


``` C++
class__shared_count{
    public:
        __shared_count(long__refs=0): count(__refs){}
        longuse_count(){
            return count;
        }
        voidincrease(){
            ++count;
        }
        voiddecrease(){
            --count;
        }

    private:
        longcount;
    };
```

count即为我们即将用来记录shared_ptr个数的变量.继续，那这部分的引用计数应该存在哪里呢？对于某个shared_ptr来说，它的生命周期可以随时结束，所以这个 __shared_count我们不能存在shared_ptr本身这块内存上，它必须是在堆上.

``` C++
__shared_count*__cntptr=new__shared_count(1);
```

后面的逻辑主要在于shared_ptr在使用过程中，要合理地增减我们的shared_count,也就是严格控制引用计数的增减逻辑；这里主要是实现几种构造和拷贝函数.

``` C++
shared_ptr(std::nullptr_t): __ptr(0), __cntptr(0){}
    shared_ptr(T*ptr): __ptr(ptr){
        LOG_INFO_LINE();
        __cntptr =new__shared_count(1);
    }
    shared_ptr(constshared_ptr<T>&another_shared): __ptr(another_shared.__ptr), __cntptr(another_shared.__cntptr){
        LOG_INFO_LINE();
        if(__cntptr){
            __cntptr->increase();
            LOG_INFO_CONTENT("increase count:  %ld\n", __cntptr->use_count());
        }
    }
    shared_ptr(shared_ptr<T>&&another_shared): __ptr(another_shared.__ptr),__cntptr(another_shared.__cntptr){
        LOG_INFO_LINE();
        another_shared.__ptr =0;
        another_shared.__cntptr =0;
    }
    // assignment
    shared_ptr&operator=(constshared_ptr<T>&another_ptr){
        LOG_INFO_LINE();
        shared_ptr<T>(another_ptr).swap(*this);
        return*this;
    }

    shared_ptr&operator=(shared_ptr<T>&&another_shared){
        LOG_INFO_LINE();
        shared_ptr<T>(thief_stl::move(another_shared)).swap(*this);
        return*this;
    }

    ~shared_ptr(){
        LOG_INFO_LINE();
        if(__cntptr && __cntptr->use_count()>=0){
            __cntptr->decrease();
            if(__cntptr->use_count()==0){
                if(__ptr){
                    delete __ptr;
                    __ptr =0;
                }
 //注意这个地方，此处我们在delete对象同时也delete了引用计数对象,考虑到weak_ptr,此处是有问题的,后文会解释
                delete __cntptr;
                __cntptr =0;
            }
        }
    }
```

这是shared_ptr的version 1代码[完整链接](https://github.com/thiefuniverse/ThiefSTL/blob/master/include/memory/shared_ptr_v1.hpp).

### weak_ptr

weak_ptr不会修改引用计数，它只在需要的时候尝试访问对象，如果发现对象还没有消亡，则通过lock函数构造一个对象的shared_ptr来进行访问.那么这里，我们如何让这个weak_ptr知道当前某个对象有没有消亡呢？很容易想到，可以让weak_ptr直接来访问对应的引用计数对象(堆上)来获取这个信息,引用计数为0则消亡. 这样的话，我们需要保证,shared_ptr都释放了的时候，管理的对象可以销毁,当前的引用计数对象必须依然存在.前面我是在shared_ptr的析构函数中，释放了引用对象之后，就直接释放了引用计数对象。显然，这样是不行的，当shared_ptr都消亡之后，当前的weak_ptr无法获取到当前引用计数的状态，也就是它不能感知到之前指向的对象是否消亡.

那么如何解决呢？也比较简单，就是再增加一个counter,用来对weak ptr进行计数.将引用计数对象的生命周期延续到所有weak ptr和shared ptr消亡. 这样的话，我们的shared_count变成了如下的样子.

```C++
class__shared_weak_count{public:
    __shared_weak_count(longshared_refs=0,longweak_refs=0): shared_count(shared_refs), weak_count(weak_refs){}
    longshared_use_count(){
        return shared_count;
    }
    longweak_use_count(){
        return weak_count;
    }
    voidincrease_shared(){
        ++shared_count;
    }
    voidincrease_weak(){
        ++weak_count;
    }
    voiddecrease_shared(){
        --shared_count;
    }
    voiddecrease_weak(){
        --weak_count;
    }
    ~__shared_weak_count(){
        LOG_INFO_CONTENT("shared weak count destruct");
    }private:
    longshared_count;
    longweak_count;};
```

和之前shared_ptr同理，我们只需合理地 increase weak counter就好了.

``` C++
// constructor
    weak_ptr(): __ptr(0), __cntptr(0){}
    weak_ptr(constweak_ptr&another): __ptr(another.__ptr), __cntptr(another.__cntptr){
        if(__cntptr){
            __cntptr->increase_weak();
        }
    }
    template<typenameA>
    weak_ptr(constshared_ptr<A>&another): __ptr(another.__ptr), __cntptr(another.__cntptr){
        if(__cntptr){
            __cntptr->increase_weak();
        }
    }
    weak_ptr(weak_ptr&&another): __ptr(another.__ptr), __cntptr(another.__cntptr){
        another.__cntptr =0;
        another.__ptr =0;
    }
    // destructor
    ~weak_ptr(){
        if(__cntptr){
            __cntptr->decrease_weak();
            if(__cntptr->weak_use_count()==0&& __cntptr->shared_use_count()==0){
                delete __cntptr;
                __cntptr =0;
            }
        }
    }
    // assignment
    weak_ptr&operator=(constweak_ptr&another){
        weak_ptr(another).swap(*this);
        return*this;
    }
    weak_ptr&operator=(weak_ptr&&another){
        weak_ptr(thief_stl::move(another)).swap(*this);
        return*this;
    }
    template<typenameA>
    weak_ptr&operator=(constshared_ptr<A>&another){
        weak_ptr(another).swap(*this);
        return*this;
    }
```

这是使用新的shared_count后的完整版 [weak_ptr](https://github.com/thiefuniverse/ThiefSTL/blob/master/include/memory/weak_ptr.hpp) 和 [shared_ptr](https://github.com/thiefuniverse/ThiefSTL/blob/master/include/memory/shared_ptr.hpp).

### unique_ptr

unique_ptr主要功能在于唯一拥有一个对象,当unique_ptr生命周期结束，它就会释放绑定对象的资源.我们需要确保对象始终被一个unique_ptr所绑定,这里我们需要先禁用拷贝构造和赋值函数.

``` C++
// forbid copy constructor and copy assignment
unique_ptr(unique_ptrconst&)=delete;unique_ptr&operator=(unique_ptrconst&)=delete;
然后，除了裸指针构造函数,我们只支持移动构造函数即可.

unique_ptr(unique_ptr&&another): __ptr(another.release()), __deleter(another.get_deleter()){
    LOG_INFO_CONTENT("rvalue constructor");}
```

完整代码见[unique_ptr](https://github.com/thiefuniverse/ThiefSTL/blob/master/include/memory/unique_ptr.hpp).

## 后文
### 当前实现的部分缺陷
当前实现尽量专注原理;一些细节,比如counter计数的原子性并没有考虑,线程安全这块目前不熟，暂时不加进来;make_shared对内存的特殊优化(对象和引用计数这两块内存可以合并在一块)在这里也没有体现,可以参考原文引用链接2,有很简洁易懂的说明.

### 从所有权的角度来看三种指针

shared_ptr: 指向对象的每个shared_ptr都可以访问该对象,只要有一个shared_ptr存在,对象就不会被销毁,生命周期一直延续,直到所有的shared_ptr生命周期结束. 即对象可同时被多个shared_ptr所拥有和访问.

unique_ptr: 对象只被唯一的一个unique_ptr所拥有和访问,可以通过move来转移所有权给另一个unique_ptr. 对象被unique_ptr拥有,生命周期也和该unique_ptr绑定，随其消亡而消亡.

weak_ptr: 可在需要的时候 **尝试访问** 其绑定对象，但是其并不拥有该对象,也正是由于其没有**拥有** ,所以其不能改变对象的生命周期;即当对象消亡时，weak_ptr便不可访问之前的对象.

举个栗子，我们用一个**鱼缸**来作为这里的实例对象来理解一下,首先，设定是这样:

鱼缸里面养了一条金鱼，鱼缸在缓慢地漏水，如果没有人不断往里面加水，鱼最终会死亡.

几种pointer分别对应人来管理这个鱼缸的方式:

> shared_ptr是说有一个鱼缸,多个人都会往里面加水，只有当所有人都离开了，都不加水了，鱼才会死.只要有一个人在，鱼就不会死.

> unique_ptr是说每个鱼缸有一个唯一的人来负责加水，如果这个人离开，鱼就会死.这个人也可以和别人交换鱼缸，或者把他的鱼缸送给没有鱼缸的人.

> weak_ptr是说一个路过的人…他看到有某个鱼缸的鱼好看，发现鱼还没死，他可以加水或者不加；当他过一段时间再看这个鱼缸的时候，发现鱼死了，他也不能再做什么了.他就是个随缘路人… 🙂

诸位青年节快乐~
