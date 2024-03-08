//// JSON
```ts
enum NodeKind {
  Rectangle,
  Vector,
}

enum NodeStateKind {
  Visible = 1,
  Locked = 2,
}

interface Node {
  // 唯一id
  id: string,
  // 类型
  kind: NodeKind,
  // 名称
  name: string,
  // 状态
  state: NodeStateKind,
  // opacity
  opacity: number,
  // 位置
  offset: Offset,
  // 大小
  size: Size,
  // 变换
  transform: Matrix4
  // 混合模式
  blendMode: BlendMode
}

interface Style {

}



```

## Element 数据结构
header 
  [version 3byte][id 4byte][indexes 4byte][content 4byte]
body 
  [length 4byte][length 4byte]...
  element...
    [id 4byte][parentId 4byte][phase 4byte][kind 1byte][state 1byte][opacity 1byte][blendMode 1byte][backgroundColor 4byte][x 4byte][y 4byte][width 4byte][height 4byte][indexs...][name][fillPaints...][strokePaints][effectPaints]

////
header-struct {
  version: 000X 000Y 000Z   6byte
  id: 0000 0000 0000 000X   8byte
}

data-struct {
  count: 0000 000X 节点数   4byte
}

node-struct {
  id: 0000 000X  4byte // 
  type: 01   1byte // 
}

node-property-struct {
  id:                    6byte
  x: -10000000000        6byte
  y: -10000000000        6byte
  width: 10000000000     6byte
  height: 1000 0000 0000 6byte 
  scale: 0.001    2byte
  rotate: 0000    2byte 
  opacity: 0.001  2byte
}

node-stroke-style-struct {
  id: 00 00 00 0X       6byte   
  style: 00             1byte       
  width:                4byte
}

node-fill-style-struct {
  id: 00 00 00 0X
  style: 
}

node-effect-style-struct {
  id: 00 00 00 0X
  style: 
}

text-struct {

}

二进制数据结构
｜version - 3byte|id - 4byte|count - 4byte|elements|paint|data|

