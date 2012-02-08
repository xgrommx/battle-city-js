
Premade = function Premade(name, type)
{
    this.name = name;
    this.type = type || 'classic';
    this.level = 1;
    this.userCount = 0;
    this.locked = false; // lock for new users
    if (!isClient()) {
        this.users = new TList(); // todo move to clan?
        switch (this.type) {
            case 'classic':
                this.clans = [new Clan(1, 10*30/*~30step per seconds*/), new BotsClan(2, 10*30/*~30step per seconds*/)];
                break;
            case 'createbot':
                this.clans = [new Clan(1, 10*30/*~30step per seconds*/), new LearnerClan(2, 10*30/*~30step per seconds*/)];
                break;
            case 'teamvsteam':
                this.clans = [new Clan(1, 2*30/*~30step per seconds*/), new Clan(2, 2*30/*~30step per seconds*/)];
                break;
        }
        this.clans[0].premade = this.clans[1].premade = this;
        this.clans[0].enemiesClan = this.clans[1];
        this.clans[1].enemiesClan = this.clans[0];
        this.messages = new TList();
    }
};

Eventable(Premade.prototype);

Premade.types = {
    'classic': {
        'levels': 35
    },
    'teamvsteam': {
        'levels': 1
    },
    'createbot': {
        'levels': 4
    }
};

Premade.prototype.say = function(message)
{
    this.messages.add(message);
    for (var i in this.messages.items) {
        if (this.messages.items[i].time + 5 * 60 * 1000 < Date.now()) {
            this.messages.remove(this.messages.items[i]);
        }
    }
};

Premade.prototype.setClan = function(user, clanId)
{
    this.clans[clanId].attachUser(user);
};

Premade.prototype.join = function(user, clanId)
{
    clanId = clanId || 0;
    if (this.type == 'teamvsteam' && this.clans[clanId].isFull()) {
        clanId = 1;
    }
    if (!this.locked && !this.clans[clanId].isFull()) {
        // todo extract to user method setPremade()
        if (user.premade) {
            user.premade.unjoin();
        }
        user.premade = this;
        this.clans[clanId].attachUser(user);
        this.users.add(user);
        this.userCount++;
        this.emit('change');
        // todo extract to user methods setLives(), setPoints() ?
        user.lives = 4;
        user.points = 0;
        user.emit('change');
        user.watchCollection(this.users, 'premade.users');
        user.watchCollection(this.messages, 'premade.messages');
    } else {
        throw {message: 'К этой игре уже нельзя присоединиться.'};
    }
};

Premade.prototype.unjoin = function(user)
{
    user.unwatchCollection('premade.users');
    user.unwatchCollection('premade.messages');
    user.unwatchCollection('f');
    user.unwatchCollection('game.botStack');
    user.unwatchCollection('goals');
    user.clan.detachUser(user);
    this.users.remove(user);
    this.userCount--;
    user.premade = null;
    this.emit('change');
    if (this.userCount == 0) {
        registry.premades.remove(this);
        this.removed = true; // dirty hack
    }
};

Premade.prototype.startGame = function()
{
    this.locked = true;
    var level = require('../battle-city/maps/' + this.type + '/level' + this.level);
    this.game = new Game(level.getMap(), this);
    this.clans[0].startGame(this.game, level);
    this.clans[1].startGame(this.game, level);
    this.users.traversal(function(user){
        user.watchCollection(this.game.field, 'f');
        if (user.clan.enemiesClan.botStack) {
            user.watchCollection(user.clan.enemiesClan.botStack, 'game.botStack');
        }
        if (user.clan.enemiesClan.goals) {
            user.watchCollection(user.clan.enemiesClan.goals, 'goals');
        }
        if (user.premade.type == 'teamvsteam') {
            user.lives = 4;
            user.emit('change');
        }
        user.clientMessage('started', {
            // todo this is for client to get lang file
            'courseId': user.currentCourse.id,
            'courseName': user.currentCourse.name,
            'exerciseId': this.level // todo level and exerciseId are the same
        });
    }, this);
    this.game.start();
    this.emit('change');
};

Premade.prototype.lock = function()
{
    this.locked = true;
    this.emit('change');
};

Premade.prototype.gameOver = function(winnerClan, timeout)
{
    if (this.game && this.game.running) {
        this.game.running = false;
        var self = this;
        if (timeout) {
            setTimeout(function(){
                self._gameOver(winnerClan);
            }, timeout ? timeout : 1000);
        } else {
            this._gameOver(winnerClan);
        }
    }
};

Premade.prototype._gameOver = function(winnerClan)
{
    if (this.game) {
        this.game.gameOver();
        if (this.type == 'teamvsteam') {
            this.locked = false;
        }
        if (this.type == 'classic' && this.clans[0] == winnerClan) {
            this.level++;
            if (this.level > Premade.types[this.type].levels) {
                this.level = 1;
            }
        }
        if (this.removed === undefined) { // todo dirty hack
            this.emit('change');
        }
        this.users.traversal(function(user){
            user.unwatchCollection('f');
            user.unwatchCollection('game.botStack');
            user.clientMessage('gameover', {
                winnerClan: winnerClan ? winnerClan.n : 0
            });
            console.log(new Date().toLocaleTimeString() + ': user ' + user.nick +
                    ' has left game ' + user.premade.name);
        }, this);
        this.clans[0].game = this.clans[1].game = this.game = null;
    }
};

Premade.prototype.serialize = function()
{
    return [
        serializeTypeMatches[this.constructor.name], // 0
        this.id, // 1
        this.name, // 2
        this.level, // 3
        this.type, // 4
        this.locked, // 5
        this.userCount, // 6
        this.gameRun || this.game && this.game.running // 7 todo avoid this kind of code
    ];
};

Premade.prototype.unserialize = function(data)
{
    this.id         = data[1];
    this.name       = data[2];
    this.level      = data[3];
    this.type       = data[4];
    this.locked     = data[5];
    this.userCount  = data[6];
    this.gameRun    = data[7];
};
