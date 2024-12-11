
# Table of Contents

1.  [Introduction](#org2a6eb0b)
2.  [Basic Theory](#org589c1ae)
    1.  [通过hash表来赋值创建模板](#org112c5f7)
        1.  [基本变量(键值)渲染](#org7e0ab8c)
        2.  [变量真值条件渲染](#org465f8ca)
        3.  [控制转义(3\*{或者&符号)](#org4a98dfd)
        4.  [列表渲染](#org0f7edd8)
        5.  [注释方式](#orgc65fd0a)
        6.  [模板嵌套](#orgf43baba)
        7.  [标签符号修改](#org00e0c2e)
        8.  [lambda 表达式支持](#org2794f8c)



<a id="org2a6eb0b"></a>

# Introduction

mustache是一个模板体系,定义了一种很简单而实用的模板实现.下文中你可以看到这个模板体系的基本特点和python实现的使用方式．


<a id="org589c1ae"></a>

# Basic Theory

(以下代码用python3进行演示,使用了mustache模板的python实现，库名叫pystache)


<a id="org112c5f7"></a>

## 通过hash表来赋值创建模板


<a id="org7e0ab8c"></a>

### 基本变量(键值)渲染

    {{=<% %>=}}
    import pystache
    print(pystache.render('Hi {{person}}!', {'person': 'Mom'}))
    #    : Hi Mom!
    <%={{ }}=%>


<a id="org465f8ca"></a>

### 变量真值条件渲染

通过判断hashtable中键值(#加变量)是否存在(存在即为真值，或者变量名前加<sup>时只有变量值为假才渲染模板</sup>)，来渲染模板．

    {{=<% %>=}}
    import pystache
    renderer=pystache.Renderer()
    parsed = pystache.parse(u"Hey {{#who}}{{.}}!{{/who}}")
    
    print(renderer.render(parsed,{})) # who 不存在故不渲染who标签部分
    print(renderer.render(parsed,{'who':'thief'}))　#分别根据who的值渲染出不同句子
    print(renderer.render(parsed,{'who':'universe'}))
    
    context = { 'author': 'Chris Wanstrath', 'maintainer': 'Chris Jerdonek' }# 一次传入多个值
    print(pystache.render("Author: {{author}}\nMaintainer: {{maintainer}}", context))
    
    print(pystache.render( "{{^is-sunny}}Take an umbrella!{{/is-sunny}}", {'is-sunny':False}))
    
    # : Hey 
    # : Hey thief!
    # : Hey universe!
    # : Author: Chris Wanstrath
    # : Maintainer: Chris Jerdonek
    # : Take an umbrella!
    <%={{ }}=%>     


<a id="org4a98dfd"></a>

### 控制转义(3\*{或者&符号)

对于变量值，如果是<等其他一些特殊字符会被 **转义** ，用三个大括号或者&符号可以取消转义，保留原字符．

    {{=<% %>=}}  
    import pystache
    renderer=pystache.Renderer()
    parsed = pystache.parse(u"{{company}}\n{{&company}}\n{{{company}}}")
    
    print(renderer.render(parsed,{'company':'<b>GitHub</b>'}))
    # : &lt;b&gt;GitHub&lt;/b&gt;
    # : <b>GitHub</b>
    # : <b>GitHub</b>
    
    <%={{ }}=%>     


<a id="org0f7edd8"></a>

### 列表渲染

对于列表，还可以作列表渲染．当#变量存在，且hashtable中的值对应为一个列表时，mustache会进行列表渲染．
分别针对值列表的每个元素依次渲染出结果．

    {{=<% %>=}}
    import pystache
    renderer=pystache.Renderer()
    parsed = pystache.parse(u"{{#repo}}\nhello,{{name}}! you are {{age}}\n{{/repo}}")
    
    print(renderer.render(parsed,
                    {'repo':[
                              {"name":"thief","age":33},
                              {"name":"fly","age":88},
                              {"name":"universe","age":99}
                    ]}))
    #  : hello,thief! you are 33
    #  : hello,fly! you are 88
    #  : hello,universe! you are 99     
    <%={{ }}=%>


<a id="orgc65fd0a"></a>

### 注释方式

    {{=<% %>=}}
    {{! It is a line for comment }}
    <%={{ }}=%>


<a id="orgf43baba"></a>

### 模板嵌套

mustache的标签支持模板嵌套(即一个模板中嵌入其他多个模板).如下是一个html模板嵌套的例子.

    {{=<& &>=}}
    <!-- use > and tags name to embed tags-name.mustache file -->
    <!DOCTYPE html>
    <html lang="en-us">
      {{> header}}
      <body class="wrapper">
        <header>
      {{> person-zone}}
      {{> nav}}
        </header>
        <section id="blog-index">
      {{> blog-index}}
        </section>
        {{> footer}}
      </body>
    </html>
    <&={{ }}=&>


<a id="org00e0c2e"></a>

### 标签符号修改

mustache的标签可以在渲染过程中修改,原始为两个大括号.

    {{=<& &>=}} 
    {{default_tags}} #原始标签
    {{=<% %>=}}   #标签改变为等号中间的新标签
    <% erb_style_tags %>　#应用新标签
    <%={{ }}=%> # 把标签改回默认的
    <&={{ }}=&>


<a id="org2794f8c"></a>

### lambda 表达式支持

mustache标签支持lambda表达式来渲染改变标签内文字.(本人并未实践，感兴趣大家可以试试😆)

