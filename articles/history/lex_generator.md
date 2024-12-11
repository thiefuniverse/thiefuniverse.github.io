
# Table of Contents

1.  [A Parser based on Regular Expression](#orgae83e8f)
    1.  [基本原理](#org3e355b0)
    2.  [Lex 程序的基本书写](#org6c4dde3)
        1.  [三个组成部分](#orgbb06efc)
        2.  [Notice](#org4fd8a57)
    3.  [lex的正则表达式](#org65a97c5)
    4.  [外部资源](#orgcea052f)



<a id="orgae83e8f"></a>

# A Parser based on Regular Expression


<a id="org3e355b0"></a>

## 基本原理

   Lex 是一个产生词法分析器的程序．怎么来产生呢？基本原理是根据输入的不同正则表达式作为规则，
来采取相应动作.词法分析器在读取数据流的过程中，不断匹配先前设定的正则表达式规则，匹配到了则直
接采取预先规定的动作．Lex可以把正则规则转化为C语言，之后可以由gcc编译产生词法分析程序．


<a id="org6c4dde3"></a>

## Lex 程序的基本书写


<a id="orgbb06efc"></a>

### 三个组成部分

书写分为三个部分,语法定义部分，语法部分，用户的其他动作．

    {definitions}
    %%
    {rules}
    %%
    {user subroutines}

    代码中这两个%%起到了分界作用，至关重要．这几类代码部分是不能混淆的，
不然就会编译出错．光是有规则还不够灵活，并不知道我们匹配到字符串之后可以
做什么.于是，词法分析器的实现本源－－C出现了．在lex文件中可以直接在某些位置适当地添加C的源码，
方便在匹配过程中执行自己的行为．下面是维基上给的例子:

    /*** Definition section ***/
    
    %{
    /* C code to be copied verbatim */
    #include <stdio.h>
    %}
    
    /* This tells flex to read only one input file */
    %option noyywrap
    
    %%
    /*** Rules section ***/
    
    /* [0-9]+ matches a string of one or more digits */
    [0-9]+  {
            /* yytext is a string containing the matched text. */
                printf("Saw an integer: %s\n", yytext);
        }
    
    .|\n    {   /* Ignore all other characters. */   }
    
    %%
    /*** C Code section ***/
    
    int main(void)
    {
    /* Call the lexer, then quit. */
        yylex();
        return 0;
    }


<a id="org4fd8a57"></a>

### Notice

注意编译过程是这样的:

先由lex把\\\*.lex 转化成lex.yy.c文件,然后用gcc 编译 cc lex.yy.c -****lfl****


<a id="org65a97c5"></a>

## lex的正则表达式

和一般的正则规定,比如grep的差不多,图如下:
![img](http://ofi8au305.bkt.clouddn.com/lex_regular.png)


<a id="orgcea052f"></a>

## 外部资源

[Lex - A Lexical Analyzer Generator](http://dinosaur.compilertools.net/lex/)

[Lex - wiki](https://en.wikipedia.org/wiki/Lex)

[Bison - gnu tool](https://www.gnu.org/software/bison/)

