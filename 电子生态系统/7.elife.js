var plan = ["############################",
            "#      #    #      o      ##",
            "#                          #",
            "#          #####           #",
            "##         #   #    ##     #",
            "###           ##     #     #",
            "#           ###      #     #",
            "#   ####                   #",
            "#   ##       o             #",
            "# o  #         o       ### #",
            "#    #                     #",
            "############################"];
// #是岩石,0是动物
function Vector(x,y){
    this.x= x;
    this.y= y;
}
//进行坐标的标识
Vector.prototype.plus = function(other){
    return new Vector(this.x + other.y,this.y+other.y);
};
//定义了网格的对象,定义世界中(x,y)位置的索引为 x+(y*width) 
function Grid(width,height){
    this.space = new Array(width*height);
    this.width = width;
    this.height = height;
}
//网格的一个属性:要求坐标,应该在 网格之内
Grid.prototype.isInside = function(vector){
    return vector.x >=0 && vector.x < this.width &&
        vector.y >=0 && vector.y < this.height;
}
Grid.prototype.get = function(vector) {
    return this.space[vector.x + this.width * vector.y];
};
Grid.prototype.set = function(vector, value) {
    this.space[vector.x + this.width * vector.y] = value;
};

//动物的编程接口
//定义8个方向
var directions = {
    "n":  new Vector( 0, -1),
    "ne": new Vector( 1, -1),
    "e":  new Vector( 1,  0),
    "se": new Vector( 1,  1),
    "s":  new Vector( 0,  1),
    "sw": new Vector(-1,  1),
    "w":  new Vector(-1,  0),
    "nw": new Vector(-1, -1)
};
//运用 Math函数产生随机的索引,来确定小动物的下一个位置
function randomElement(array){
    return array[Math.floor(Math.random() * array.length)];
}

var directionNames = "n ne e se s sw w nw".split(" ");
//判断小动物的爬行方向
function BouncingCritter(){
    this.direction = randomElement(directionNames);
}
BouncingCritter.prototype.act = function(view){
    if(view.look(this.direction) !=" ")
        this.direction = view.find(" ") || "s";
    return {type : "move",direction: this.direction};
};

//查找字符所对应的构造函数,并使用new 来创建对应类型的实例
function elementFromChar(legend, ch) {
    if (ch == " ")
      return null;
    var element = new legend[ch]();
    element.originChar = ch;
    return element;
  }
  
function World(map, legend) {
    var grid = new Grid(map[0].length, map.length);
    this.grid = grid;
    this.legend = legend;
  
    map.forEach(function(line, y) {
      for (var x = 0; x < line.length; x++)
        grid.set(new Vector(x, y),
                 elementFromChar(legend, line[x]));
    });
}

//根据世界对象的当前状态构造出一个类似于地图的字符串
function charFromElement(element) {
    if (element == null)
      return " ";
    else
      return element.originChar;
  }
  
  World.prototype.toString = function() {
    var output = "";
    for (var y = 0; y < this.grid.height; y++) {
      for (var x = 0; x < this.grid.width; x++) {
        var element = this.grid.get(new Vector(x, y));
        output += charFromElement(element);
      }
      output += "\n";
    }
    return output;
  };
  
  function Wall() {}
  
  var world = new World(plan, {"#": Wall,
                               "o": BouncingCritter});

Grid.prototype.forEach = function(f, context) {
  for (var y = 0; y < this.height; y++) {
    for (var x = 0; x < this.width; x++) {
      var value = this.space[x + y * this.width];
      if (value != null)
        f.call(context, value, new Vector(x, y));
    }
  }
};

//跳过已经走过的网格
World.prototype.turn = function() {
    var acted = [];
    this.grid.forEach(function(critter, vector) {
      if (critter.act && acted.indexOf(critter) == -1) {
        acted.push(critter);
        this.letAct(critter, vector);
      }
    }, this);
};

World.prototype.letAct = function(critter, vector) {
    var action = critter.act(new View(this, vector));
    if (action && action.type == "move") {
      var dest = this.checkDestination(action, vector);
      if (dest && this.grid.get(dest) == null) {
        this.grid.set(vector, null);
        this.grid.set(dest, critter);
      }
    }
};
  
World.prototype.checkDestination = function(action, vector) {
    if (directions.hasOwnProperty(action.direction)) {
      var dest = vector.plus(directions[action.direction]);
      if (this.grid.isInside(dest))
        return dest;
    }
};
//获取世界对象的信息以及动物在世界中的当前位置
function View(world, vector){
    this.world = world;
    this.vector = vector;
}

View.prototype.look = function(dir){
    var target = this.vector.plus(directions[dir]);
    if(this.world.grid.isInside(target))
        return charFromElement(this.world.grid.get(target));
    else
    return "#";
};
View.prototype.findAll = function(ch){
    var found = [];
    for(var dir in directions)
        if(this.look(dir)==ch)
            found.push(dir);
    return found;
};
View.prototype.find = function(ch){
    var found= this.findAll(ch);
    if(found.length==0) return null;
    return randomElement(found);
};
//计算动物的相对方向
function dirPlus(dir, n) {
    var index = directionNames.indexOf(dir);
    return directionNames[(index + n + 8) % 8];
}
//如果 都有障碍物,则往南移动
function WallFollower() {
    this.dir = "s";
}
  
WallFollower.prototype.act = function(view) {
    var start = this.dir;
    if (view.look(dirPlus(this.dir, -3)) != " ")
      start = this.dir = dirPlus(this.dir, -2);
    while (view.look(this.dir) != " ") {
      this.dir = dirPlus(this.dir, 1);
      if (this.dir == start) break;
    }
    return {type: "move", direction: this.dir};
};
//继承letAct 方法, 覆盖,形成新的,在原来的生态系统中,可以继续使用
function LifelikeWorld(map,legend){
    World.call(this,map,legend);
}
LifelikeWorld.prototype = Object.create(World.prototype);

var actionTypes = Object.create(null);

LifelikeWorld.prototype.letAct = function(critter, vector) {
    var action = critter.act(new View(this, vector));
    var handled = action &&
      action.type in actionTypes &&
      actionTypes[action.type].call(this, critter,
                                    vector, action);
    if (!handled) {
      critter.energy -= 0.2;
      if (critter.energy <= 0)
        this.grid.set(vector, null);
    }
};

actionTypes.grow = function(critter) {
    critter.energy += 0.5;
    return true;
  };
  
actionTypes.move = function(critter, vector, action) {
    var dest = this.checkDestination(action, vector);
    if (dest == null ||
        critter.energy <= 1 ||
        this.grid.get(dest) != null)
      return false;
    critter.energy -= 1;
    this.grid.set(vector, null);
    this.grid.set(dest, critter);
    return true;
};
  
actionTypes.eat = function(critter, vector, action) {
    var dest = this.checkDestination(action, vector);
    var atDest = dest != null && this.grid.get(dest);
    if (!atDest || atDest.energy == null)
      return false;
    critter.energy += atDest.energy;
    this.grid.set(dest, null);
    return true;
};
  
actionTypes.reproduce = function(critter, vector, action) {
    var baby = elementFromChar(this.legend,
                               critter.originChar);
    var dest = this.checkDestination(action, vector);
    if (dest == null ||
        critter.energy <= 2 * baby.energy ||
        this.grid.get(dest) != null)
      return false;
    critter.energy -= 2 * baby.energy;
    this.grid.set(dest, baby);
    return true;
};

function Plant(){
    this.energy = 3 + Math.random()*4;
}

Plant.prototype.act = function(context){
    if(this.energy>15){
        var space = context.find(" ");
        if(space)
            return {type:"reproduce",direction:space};
    }
    if(this.energy<20){
        return {type:"grow"};
    }
};
//定义每个食草动物的能量初始值
function PlantEater() {
    this.energy = 20;
  }
PlantEater.prototype.act = function(view) {
    var space = view.find(" ");
    if (this.energy > 60 && space)
      return {type: "reproduce", direction: space};
    var plant = view.find("*");
    if (plant)
      return {type: "eat", direction: plant};
    if (space)
      return {type: "move", direction: space};
};

var valley = new LifelikeWorld(
    ["############################",
     "#####                 ######",
     "##   ***                **##",
     "#   *##**         **  O  *##",
     "#    ***     O    ##**    *#",
     "#       O         ##***    #",
     "#                 ##**     #",
     "#   O       #*             #",
     "#*          #**       O    #",
     "#***        ##**    O    **#",
     "##****     ###***       *###",
     "############################"],
    {"#": Wall,
     "O": PlantEater,
     "*": Plant}
);
