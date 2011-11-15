
Base = function Base(x, y)
{
    AbstractGameObject.call(this, 16, 16);
    this.x = x;
    this.y = y;
    this.img[0] = 'img/base.png';
};

Base.prototype = new AbstractGameObject();
Base.prototype.constructor = Base;
Base.prototype.baseEdge = [
          {x: 11, y: 23}
        , {x: 11, y: 24}
        , {x: 11, y: 25}
        , {x: 12, y: 23}
        , {x: 13, y: 23}
        , {x: 14, y: 23}
        , {x: 14, y: 24}
        , {x: 14, y: 25}
    ];

Eventable(Base.prototype);

Base.prototype.serialize = function()
{
    return [
        battleCityTypesSerialize['Base'],
        this.id,
        this.x,
        this.y
    ];
    // z is constant
};

Base.prototype.unserialize = function(data)
{
    this.id = data[1];
    if (this.field) {
        this.field.setXY(this, data[2], data[3]);
    } else {
        // first unserialize, before adding to field -> may set x and y directly
        this.x = data[2];
        this.y = data[3];
    }
};

Base.prototype.hit = function()
{
    this.field.game.gameOver(0);
    return true;
};

Base.prototype.step = function()
{
    if (this.armoredTimer > 0) {
        if (--this.armoredTimer <= 0) {
            for (var i in this.baseEdge) {
                var cell = this.baseEdge[i];
                var walls = this.field.intersect(this, cell.x*16+8, cell.y*16+8, 8, 8);
                var convert = true;
                for (var j in walls) {
                    if (!(walls[j] instanceof Wall)) {
                        convert = false;
                    }
                }
                if (convert) {
                    for (var j in walls) {
                        this.field.remove(walls[j]);
                    }
                    this.field.add(new Wall(cell.x*16+ 4, cell.y*16+ 4));
                    this.field.add(new Wall(cell.x*16+ 4, cell.y*16+12));
                    this.field.add(new Wall(cell.x*16+12, cell.y*16+ 4));
                    this.field.add(new Wall(cell.x*16+12, cell.y*16+12));
                }
            }
        }
    }
};
