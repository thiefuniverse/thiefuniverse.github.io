# how? std::function in C++

[TOC]

[TAG:C++]

[TIME:2018-3-17]

![](std_function/1.jpg)
本文旨在探讨C++11中引入的 std::function的实现原理.



### 应用

        在正常使用时function 主要会用来存储可调用的对象，如函数指针、可调用类、类成员函数、lambda等. 如下是正常使用时可能会出现的场景.
 
``` C++
#include <functional>
#include <iostream>

int getOne() {
    return 1;
}

struct getTwo {
    getTwo() {}
    int operator()() {
        return 2;
    }
};

class getNumber {
public:
    int getThree() {
        return 3;
    }
    static int getFour() {
        return 4;
    }
};

int main() {
    // basic function
    std::function< int() > getNumber(getOne);
    std::cout << getNumber() << std::endl;

    // class which override operator()
    std::function< int() > getNumber2(getTwo{});
    std::cout << getNumber2() << std::endl;

    // non static member function
    class getNumber n;
    std::function< int(class getNumber *) > getNumber3 = &getNumber::getThree;
    std::cout << getNumber3(&n) << std::endl;

    std::function< int(class getNumber *) > getNumber4 = std::bind(&getNumber::getThree, &n);
    std::cout << getNumber4(&n) << std::endl;

    std::function< int(class getNumber *) > getNumber5(&getNumber::getThree);
    std::cout << getNumber5(&n) << std::endl;

    // static member function
    std::function< int() > getNumber6(&getNumber::getFour);
    std::cout << getNumber6() << std::endl;
    return 0;
}
1
2
3
3
3
4

```

### 参考实现

        先不管标准库如何实现，我们尝试实现类似std::function的功能;如下开始时的实现并没有考虑复杂参数的场景，为了简化问题,只考虑了int(int)这种函数原型，后面的优化方案中会对这一点进行优化.


#### 1.虚基父类多态方式,存储可调用对象

        从实际应用中我们可以看到function需要能够存储构造它的可调用对象的状态,而且可调用对象可能是多样的，各种可调用的类或者函数;一种比较容易理解的实现方案是这样的，每个function在实例化的时候，会构造对应的一个子类并实例化存在堆上，然后对于function本身来说，只存储一个父类的指针。这样的话，在function的调用过程中，就可以动态地执行相应可调用对象(即子类).


``` C++
#include <functional>
#include <iostream>

int getOne(int a) {
    return 1;
}

struct getTwo {
    getTwo() {}
    int operator()(int a) {
        return 2;
    }
};

// 默认特化不实现
template < typename T >
class Function;

template < typename Ret, typename Args0 >
class Function< Ret(Args0) > {
    //构造虚基类以存储任意可调用对象的指针
    struct callable_base {
        virtual Ret operator()(Args0 a0) = 0;
        virtual struct callable_base *copy() const = 0;
        virtual ~callable_base(){};
    };
    struct callable_base *base;

    template < typename T >
    struct callable_dervied : public callable_base {
        T f;
        callable_dervied(T functor) : f(functor) {}
        Ret operator()(Args0 a0) {
            return f(a0);
        }
        struct callable_base *copy() const {
            return new callable_dervied< T >(f);
        }
    };

public:
    template < typename T >
    Function(T functor) : base(new callable_dervied< T >(functor)) {}
    Function() : base(nullptr) {}
    // 实际调用存储的函数
    Ret operator()(Args0 arg0) {
        return (*base)(arg0);
    }

    Function(const Function &f) {
        std::cout << "copy construct" << std::endl;
        base = f.base->copy();
    }
    Function &operator=(const Function &f) {
        std::cout << "asign construct" << std::endl;
        delete base;
        base = f.base->copy();
        return *this;
    }

    ~Function() {
        std::cout << "delete current base callable object" << std::endl;
        delete base;
    }
};

int main() {
    // basic function
    class Function< int(int) > getNumber(getOne);
    std::cout << getNumber(3) << std::endl;

    // class which override operator()
    class Function< int(int) > getNumber2(getTwo{});
    std::cout << getNumber2(2) << std::endl;

    class Function< int(int) > getNumber3 = getNumber2;
    getNumber3 = getNumber;
    return 0;
}

1
2
copy construct
asign construct
delete current base callable object
delete current base callable object
delete current base callable object

```

#### 2.存储可调用对象的内存指针以及调用、拷贝和析构函数的指针

        在上一个多态方案中，在构造Function时，会根据当前的可调用对象类型来实例化子类，通过存储指向可调用对象的父类指针，直接对可调用对象进行比如调用、拷贝、释放等操作;类似地，我们也可以直接构造一个新的可调用对象，将其对应指针存储在Function中，但是，有个问题是，不使用多态这种形式的话，想存储多种可能变化的实例对象，只能使用void *指针来进行操作，见以下代码中 any_callable. 对于这个对象的使用，我们必须能够获取它的类型并进行我们需要的调用、拷贝以及释放等操作. 我们知道，在Function实例化的过程中，是可以得到可调用对象的类型信息的, 借助这一点，我们可以通过使用三类静态函数的模板来直接有针对性地实例化三个函数(call, copy,destruct)，并将该函数指针分别存储在Function中.由于这三个函数内部包含了any_callable所指向的可调用对象的类型信息，所以可以直接对这个void *指针指向对区域进行操作.

 
``` C++
#include <functional>
#include <iostream>
int getOne(int a) {    return 1;
}

struct getTwo {
    getTwo() {}
    int operator()(int a) {
        return 2;
    }
};

class getNumber {
public:
    int getThree(int a) {
        return 3;
    }
    static int getFour(int a) {
        return 4;
    }
};

// 默认特化不实现
template < typename T >
class Function;

template < typename Ret, typename Args0 >
class Function< Ret(Args0) > {
    // 不借助多态来存储各种类型的可调用对象，使用如下三个函数指针来调用.
    Ret (*call_func)(Function *, Args0);
    void *(*copy_func)(const Function &);
    void (*destruct_func)(const Function &);

    template < typename T >
    static Ret call(Function *f, Args0 args0) {
        T *call_obj = static_cast< T * >(f->any_callable);
        return (*call_obj)(args0);
    }
    template < typename T >
    static void *copy(const Function &f) {
        return new T(*static_cast< T * >(f.any_callable));
    }
    template < typename T >
    static void destruct(const Function &f) {
        delete static_cast< T * >(f.any_callable);
    }
    void *any_callable;

public:
    // 对于可调用对象，Function在构造时会根据fuctor的类型来实例化 call, copy和destruct三个函数.
    template < typename T >
    Function(T functor) : call_func(call< T >), copy_func(copy< T >), destruct_func(destruct< T >), any_callable(new T(functor)) {}
    Function() : any_callable(nullptr) {}
    // 实际调用存储的函数
    Ret operator()(Args0 arg0) {
        return call_func(this, arg0);
    }

    Function(const Function &f) : call_func(f.call_func), copy_func(f.copy_func), destruct_func(f.destruct_func), any_callable(copy_func(f)) {}
    Function &operator=(const Function &f) {
        std::cout << "asign construct" << std::endl;
        destruct_func(*this);
        any_callable = copy_func(f);
        return *this;
    }

    ~Function() {
        std::cout << "delete current base callable object" << std::endl;
        destruct_func(*this);
    }
};

int main() {
    // basic function
    class Function< int(int) > getNumber(getOne);
    std::cout << getNumber(3) << std::endl;

    // class which override operator()
    class Function< int(int) > getNumber2(getTwo{});
    std::cout << getNumber2(2) << std::endl;

    class Function< int(int) > getNumber7 = getNumber2;
    //    getNumber3 = getNumber;
    return 0;
}

1
2
delete current base callable object
delete current base callable object
delete current base callable object
```

#### 3.优化当前方案

当前方案如前文所说只支持int(int)这一种函数签名,为了使我们的实现更具适应性、鲁棒性，我尝试做了如下改进.

##### 任意参数适配

使用C++11特性,可变参数模板以及 perfect forwarding, 增强对参数类型的适配.
比如对于方案1中虚函数方案,我们作出如下修改,将模板参数改为可变参数.


``` C++
template < typename Ret, typename... Args >
class Function< Ret(Args...) > {
    //构造虚基类以存储任意可调用对象的指针
    struct callable_base {
        // 注释M 此处Args我们在参数后面加了&&, 这个地方比较关键.
        virtual Ret operator()(Args &&... a) = 0;   // line 1 **
        virtual struct callable_base *copy() const = 0;
        virtual ~callable_base(){};
    };
    struct callable_base *base;

    template < typename T >
    struct callable_dervied : public callable_base {
        T f;
        callable_dervied(T functor) : f(functor) {}
        Ret operator()(Args &&... a) {             // line 2  **
            return f(std::forward< Args >(a)...);
        }

        struct callable_base *copy() const {
            return new callable_dervied< T >(f);
        }
    };

public:
    template < typename T >
    Function(T functor) : base(new callable_dervied< T >(functor)) {}
    Function() : base(nullptr) {}
    // 实际调用存储的函数
    Ret operator()(Args... arg) {
        return (*base)(std::forward< Args >(arg)...);
    }
    Function(const Function &f) {
        std::cout << "copy construct" << std::endl;
        base = f.base->copy();
    }
    Function &operator=(const Function &f) {
        std::cout << "asign construct" << std::endl;
        delete base;
        base = f.base->copy();
        return *this;
    }

    ~Function() {
        std::cout << "delete current base callable object" << std::endl;
        delete base;
    }
};

```

        可以看到，相比于之前的版本，我在模板类参数里面加个对应的可变参数类型,但是只是加了这些后我和std::function的调用效果对比了一下，发现我这边在调用相同部分的代码时，我这边的实现会多调用一次右值拷贝构造函数.好好看了下代码后发现，在注释*line1*和*line2*的位置，我没有声明成Args&&,导致当我的Function函数参数声明成非引用类型时，这个callable_derived的operator函数的参数类型并不是引用类型.然而实际上,由于这一层的值其实是可以完全利用上一层得到的参数的.加上Args&&后，当Function的模板参数中有右值的话，这个地方就会是右值引用，上一层调用（Function的operator函数)已经过forward转成了右值引用，所以这一层就会减少一次构造. 和std::function至少在调用这块的性能上可以保持相似.

完整代码可以参考[这里](https://github.com/thiefuniverse/reading_coding/tree/master/lang/c%2B%2B/std/function),分别对应方案1和方案2的改进.



##### 内存优化
目前都是从堆上申请的内存,实际上对于一些很小的对象（比如小的class或者本身就是一个函数指针),我们直接将对象存储在一个指针大小的内存空间下,该方案此处暂未实现.

### 一些标准库的实现
#### gcc(8.2.0)
看了我的电脑里gcc 8.2.0中的std_function.h实现，发现大体思路和上面我们的参考实现1基本一致，而且实现里面还考虑到内存较小时直接就使用指针大小(接近指针大小，可能是倍数)的内存来存储可调用对象.

``` C++
// file: bits/std_function.h

  class _Undefined_class;

// 不拷贝类型，看后面的使用情况，这里应该是通过定义union,得到一般的指针大小上限,在我
// 的电脑(64位)上，这个gcc实现里面是成员指针需要的空间最大，需要16个字节存储,关于这块
// 的指针size可以参考原文中的链接 :(
  union _Nocopy_types
  {
    void*       _M_object;
    const void* _M_const_object;
    void (*_M_function_pointer)();
    void (_Undefined_class::*_M_member_pointer)();
  };

// 定义_Any_data,后面使用该union存储可调用对象,如果对象小于_Any_data的size,
// 直接在_Any_data的内存处进行构造.
  union [[gnu::may_alias]] _Any_data
  {
    void*       _M_access()       { return &_M_pod_data[0]; }
    const void* _M_access() const { return &_M_pod_data[0]; }

    template<typename _Tp>
      _Tp&
      _M_access()
      { return *static_cast<_Tp*>(_M_access()); }

    template<typename _Tp>
      const _Tp&
      _M_access() const
      { return *static_cast<const _Tp*>(_M_access()); }

    _Nocopy_types _M_unused;
    char _M_pod_data[sizeof(_Nocopy_types)];
  };


// 定义了几类对于可调用对象的operation, 感觉这块的原理和方案2实际上异曲同工，本
// 质上都是需要这几个操作.根据是否启用rtti, 此处还额外有 get_type_info的operation
  enum _Manager_operation
  {
    __get_type_info,
    __get_functor_ptr,
    __clone_functor,
    __destroy_functor
  };


// 可调用对象如果存储在本地，__source(Any_data)的首地址就是_Functor的地址;否则
// 则是其本身的值作为_Functor地址
// Retrieve a pointer to the function object
static _Functor*
_M_get_pointer(const _Any_data& __source)
{
  const _Functor* __ptr =
    __stored_locally? std::__addressof(__source._M_access<_Functor>())
    /* have stored a pointer */ : __source._M_access<_Functor*>();
  return const_cast<_Functor*>(__ptr);
}

// 以下可以看到两种情况下的clone和destroy; 使用placement new 原地构造_Functor,
// 相应地Destroy的时候也需要原地调用析构函数
// Clone a location-invariant function object that fits within
// an _Any_data structure.
static void
_M_clone(_Any_data& __dest, const _Any_data& __source, true_type)
{
  ::new (__dest._M_access()) _Functor(__source._M_access<_Functor>());
}

// Clone a function object that is not location-invariant or
// that cannot fit into an _Any_data structure.
static void
_M_clone(_Any_data& __dest, const _Any_data& __source, false_type)
{
  __dest._M_access<_Functor*>() =
    new _Functor(*__source._M_access<_Functor*>());
}

// Destroying a location-invariant object may still require
// destruction.
static void
_M_destroy(_Any_data& __victim, true_type)
{
  __victim._M_access<_Functor>().~_Functor();
}

// Destroying an object located on the heap.
static void
_M_destroy(_Any_data& __victim, false_type)
{
  delete __victim._M_access<_Functor*>();
}
```

主体部分如上，function底下使用 FunctionBase来统一处理 _Functor本身可能调用的多样性.



#### llvm(9.0.0)
看了llvm 9.0的这部分代码,目前底层实际上提供了两种实现:

``` C++
// include/functional
// 提供了__value_func和 __policy_func两种实现
template<class _Rp, class ..._ArgTypes>
class _LIBCPP_TEMPLATE_VIS function<_Rp(_ArgTypes...)>
    : public __function::__maybe_derive_from_unary_function<_Rp(_ArgTypes...)>,
      public __function::__maybe_derive_from_binary_function<_Rp(_ArgTypes...)>
{
#ifndef _LIBCPP_ABI_OPTIMIZED_FUNCTION
    typedef __function::__value_func<_Rp(_ArgTypes...)> __func;
#else
    typedef __function::__policy_func<_Rp(_ArgTypes...)> __func;
#endif

    __func __f_;


// 其中 __value_func 类似我们的方案一, __func成员是一个父类(__base)的指针,在构造后指向包含可调用对象的子类
template <class _Rp, class... _ArgTypes> class __value_func<_Rp(_ArgTypes...)>
{
    typename aligned_storage<3 * sizeof(void*)>::type __buf_;

    typedef __base<_Rp(_ArgTypes...)> __func;
    __func* __f_;
}

// __policy_func 使用了一个__invoker和一个 __policy对象来分离对可调用对象的操作,其中 __invoker负责调用,
// __policy 负责定义对可调用对象的拷贝和销毁操作, 这个和我们方案二的实现原理相似.
template <class _Rp, class... _ArgTypes> class __policy_func<_Rp(_ArgTypes...)>
{
    // Inline storage for small objects.
    __policy_storage __buf_;

    // Calls the value stored in __buf_. This could technically be part of
    // policy, but storing it here eliminates a level of indirection inside
    // operator().
    typedef __function::__policy_invoker<_Rp(_ArgTypes...)> __invoker;
    __invoker __invoker_;

    // The policy that describes how to move / copy / destroy __buf_. Never
    // null, even if the function is empty.
    const __policy* __policy_;

// 以下是__policy的定义
struct __policy
{
    // Used to copy or destroy __large values. null for trivial objects.
    void* (*const __clone)(const void*);
    void (*const __destroy)(void*);

    // True if this is the null policy (no value).
    const bool __is_null;

    // The target type. May be null if RTTI is disabled.
    const std::type_info* const __type_info;

    // Returns a pointer to a static policy object suitable for the functor
    // type.
    template <typename _Fun>
    _LIBCPP_INLINE_VISIBILITY static const __policy* __create()
    {
      // 此处的__choose_policy会根据可调用对象大小，判断是否要申请内存，继而定义__close和__destroy函数.
      // 如果对象比我们预留的空间小,则这两个函数会被赋值为空.
        return __choose_policy<_Fun>(__use_small_storage<_Fun>());
    }

// 对于两种底层实现来说,都会考虑可调用对象size较小时直接在两个或者三个指针大小的空间中构造.
// True if _Fun can safely be held in __policy_storage.__small.
template <typename _Fun>
struct __use_small_storage
    : public _VSTD::integral_constant<
          bool, sizeof(_Fun) <= sizeof(__policy_storage) &&
                    _LIBCPP_ALIGNOF(_Fun) <= _LIBCPP_ALIGNOF(__policy_storage) &&
                    _VSTD::is_trivially_copy_constructible<_Fun>::value &&
                    _VSTD::is_trivially_destructible<_Fun>::value> {};
```

另外，llvm实现中还单独特化了可调用对象无参数，1，2，3个参数的情形,具体代码在include/__function_03 中.
完整代码在[这里](https://github.com/thiefuniverse/reading_coding/tree/master/lang/c%2B%2B/std/function)