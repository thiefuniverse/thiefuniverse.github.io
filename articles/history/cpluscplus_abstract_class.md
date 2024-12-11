
# Table of Contents

1.  [C++ 抽象类和接口的实现](#org4cf9eba)
2.  [虚函数的动态绑定](#org1e1dfd1)
3.  [三种继承的性质](#orge7cb225)
    1.  [public 继承](#org1e6b843)
    2.  [private 继承](#org84d8fc9)
    3.  [protected 继承](#orgf086d4e)
    4.  [private:](#org48cc29b)
        1.  [该类中的函数](#org811213f)
        2.  [该类的友元函数](#org3fa89d9)
        3.  [不能被任何其他访问,该类的object也不能访问.](#org95f4077)
    5.  [protected:](#org061e5c4)
        1.  [该类的函数](#org6f6d868)
        2.  [子类的函数](#org349d89b)
        3.  [该类的友元函数,该类的object也不能访问](#org74c1bac)
    6.  [public:](#org6f0cc82)
        1.  [该类中的函数](#orgc69fb1f)
        2.  [子类的函数](#orgaeba22b)
        3.  [该类的友元函数](#org931229c)
        4.  [该类的对象](#orgee8451d)



<a id="org4cf9eba"></a>

# C++ 抽象类和接口的实现

C++中的接口是通过 **抽象类** 来实现的,抽象类中全是纯虚函数时,则可实现该类的接口作用.如果类中含有纯虚函数也有其他变量,此时该抽象类可以作为一个父类(而不只是接口)来提供基本的变量和属性.


<a id="org1e1dfd1"></a>

# 虚函数的动态绑定

下面这段代码中让父类类型的指针指向子类的object,当父类的hello方法声明为虚函数时,该指针可动态地自动调用子类(本身它指向的就是子类的object)的方法;然而如果父类不声明为虚函数时,该指针会执行父类的hello函数.

    #include <iostream>
      class Parent
      {
      public:
      virtual void hello(){
          std::cout << "I'm parent.\n";
      }
      };
    
      class child: public Parent
      {
          public :
          void hello()
          {
              std::cout << "I'm child.";
          }
      };
      int main()
      {
          Parent *a=new child();
          a->hello();
          return 0;
      }


<a id="orge7cb225"></a>

# 三种继承的性质


<a id="org1e6b843"></a>

## public 继承

<table border="2" cellspacing="0" cellpadding="6" rules="groups" frame="hsides">


<colgroup>
<col  class="org-left" />

<col  class="org-left" />
</colgroup>
<tbody>
<tr>
<td class="org-left">父类</td>
<td class="org-left">子类</td>
</tr>


<tr>
<td class="org-left">public</td>
<td class="org-left">public</td>
</tr>


<tr>
<td class="org-left">protected</td>
<td class="org-left">protected</td>
</tr>


<tr>
<td class="org-left">private</td>
<td class="org-left">no power</td>
</tr>
</tbody>
</table>


<a id="org84d8fc9"></a>

## private 继承

<table border="2" cellspacing="0" cellpadding="6" rules="groups" frame="hsides">


<colgroup>
<col  class="org-left" />

<col  class="org-left" />
</colgroup>
<tbody>
<tr>
<td class="org-left">父类</td>
<td class="org-left">子类</td>
</tr>


<tr>
<td class="org-left">public</td>
<td class="org-left">private</td>
</tr>


<tr>
<td class="org-left">protected</td>
<td class="org-left">private</td>
</tr>


<tr>
<td class="org-left">private</td>
<td class="org-left">no power</td>
</tr>
</tbody>
</table>


<a id="orgf086d4e"></a>

## protected 继承

<table border="2" cellspacing="0" cellpadding="6" rules="groups" frame="hsides">


<colgroup>
<col  class="org-left" />

<col  class="org-left" />
</colgroup>
<tbody>
<tr>
<td class="org-left">父类</td>
<td class="org-left">子类</td>
</tr>


<tr>
<td class="org-left">public</td>
<td class="org-left">protected</td>
</tr>


<tr>
<td class="org-left">protected</td>
<td class="org-left">protected</td>
</tr>


<tr>
<td class="org-left">private</td>
<td class="org-left">no power</td>
</tr>
</tbody>
</table>

其中,三种访问标号的 **访问范围** 是:


<a id="org48cc29b"></a>

## private:


<a id="org811213f"></a>

### 该类中的函数


<a id="org3fa89d9"></a>

### 该类的友元函数


<a id="org95f4077"></a>

### 不能被任何其他访问,该类的object也不能访问.


<a id="org061e5c4"></a>

## protected:


<a id="org6f6d868"></a>

### 该类的函数


<a id="org349d89b"></a>

### 子类的函数


<a id="org74c1bac"></a>

### 该类的友元函数,该类的object也不能访问


<a id="org6f0cc82"></a>

## public:


<a id="orgc69fb1f"></a>

### 该类中的函数


<a id="orgaeba22b"></a>

### 子类的函数


<a id="org931229c"></a>

### 该类的友元函数


<a id="orgee8451d"></a>

### 该类的对象

