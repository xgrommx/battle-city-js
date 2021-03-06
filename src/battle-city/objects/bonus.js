define(['src/battle-city/objects/abstract.js',
        'src/common/event.js'], function(AbstractGameObject, Eventable) {
    /**
     * drawable
     * coordinates
     */

    function Bonus(x, y)
    {
        AbstractGameObject.call(this, 16, 16);
        this.x = x;
        this.y = y;
        this.z = 2;
    };

    Bonus.prototype = new AbstractGameObject();
    Bonus.prototype.constructor = Bonus;

    Eventable(Bonus.prototype);

    Bonus.prototype.hit = function(bullet)
    {
        return false;
    };

    function BonusStar(x, y)
    {
        Bonus.apply(this, arguments);
        this.img[0] = 'img/star.png';
    };

    BonusStar.prototype = new Bonus();
    BonusStar.prototype.constructor = BonusStar;

    BonusStar.prototype.applyTo = function(tank)
    {
        if (tank.maxBullets == 1) {
            tank.maxBullets = 2;
        } else if (tank.bulletPower == 1) {
            tank.bulletPower = 2;
        }
    };

    function BonusGrenade(x, y)
    {
        Bonus.apply(this, arguments);
        this.img[0] = 'img/grenade.png';
    };

    BonusGrenade.prototype = new Bonus();
    BonusGrenade.prototype.constructor = BonusGrenade;

    BonusGrenade.prototype.applyTo = function(tank)
    {
        // hit() cause splice tank.clan.enemiesClan.users, so collect tanks first
        var tanks = [];
        for (var i in tank.clan.enemiesClan.users) {
            tanks.push(tank.clan.enemiesClan.users[i].tank);
        }
        for (var i in tanks) {
            tanks[i].hit();
        }
    };

    function BonusShovel(x, y)
    {
        Bonus.apply(this, arguments);
        this.img[0] = 'img/shovel.png';
    };

    BonusShovel.prototype = new Bonus();
    BonusShovel.prototype.constructor = BonusShovel;

    BonusShovel.prototype.applyTo = function(tank)
    {
        if (!tank.clan.isBots()) {
            tank.clan.base.armor();
        }
    };

    function BonusHelmet(x, y)
    {
        Bonus.apply(this, arguments);
        this.img[0] = 'img/helmet.png';
    };

    BonusHelmet.prototype = new Bonus();
    BonusHelmet.prototype.constructor = BonusHelmet;

    BonusHelmet.prototype.applyTo = function(tank)
    {
        tank.armoredTimer = tank.clan.defaultArmoredTimer;
    };

    function BonusLive(x, y)
    {
        Bonus.apply(this, arguments);
        this.img[0] = 'img/live.png';
    };

    BonusLive.prototype = new Bonus();
    BonusLive.prototype.constructor = BonusLive;

    BonusLive.prototype.applyTo = function(tank)
    {
        tank.user.lives++;
        tank.user.emit('change');
    };

    function BonusTimer(x, y)
    {
        Bonus.apply(this, arguments);
        this.img[0] = 'img/timer.png';
    };

    BonusTimer.prototype = new Bonus();
    BonusTimer.prototype.constructor = BonusTimer;

    BonusTimer.prototype.applyTo = function(tank)
    {
        tank.clan.enemiesClan.pauseTanks();
    };

    return {
        Bonus: Bonus,
        BonusStar: BonusStar,
        BonusGrenade: BonusGrenade,
        BonusShovel: BonusShovel,
        BonusHelmet: BonusHelmet,
        BonusLive: BonusLive,
        BonusTimer: BonusTimer
    };
});