var CORE_ENGINE_VERSION = "2.1";
var CORE_ENGINE_API_LEVEL = 12;
var CORE_ENGINE_CONFIG_LOCK = 4;

var Network = MCSystem.getNetwork();

function getMCPEVersion() {
    var version = {
        str: MCSystem.getMinecraftVersion() + ""
    };
    version.array = version.str.split(".");
    for (var i in version.array) {
        version.array[i] = parseInt(version.array[i]) || 0;
    }
    version.main = version.array[1] + version.array[0] * 17;
    return version;
}
var MCPE_VERSION = getMCPEVersion();
var MCPE_VERSION_SUPPORT = {
    17: true
};

function getMcContext() {
    return MCSystem.getContext();
}
String.prototype.startsWith = function(str) {
    return (this.indexOf(str) == 0);
};
var nonSavesObjectSaver = Saver.registerObjectSaver("nonSavesObjectSaver", {
    read: function() {
        return null;
    },
    save: function() {
        return null;
    }
});
var GuiUtils = {
    Run: function(func) {
        MCSystem.runAsUi({
            run: function() {
                try {
                    func();
                } catch (e) {
                    Logger.Log("exception occurred in runOnUiThread (GuiUtils.Run)", "ERROR");
                    Logger.LogError(e);
                }
            }
        });
    }
};

function getPlayerX() {
    return Player.getX();
}

function getPlayerY() {
    return Player.getY();
}

function getPlayerZ() {
    return Player.getZ();
}
var FileTools = {
    mntdir: "/mnt",
    root: android.os.Environment.getExternalStorageDirectory().getAbsolutePath() + "/",
    moddir: __packdir__ + "innercore/mods/",
    mkdir: function(dir) {
        var file = new java.io.File(this.getFullPath(dir));
        file.mkdirs();
    },
    mkworkdirs: function() {
        this.mkdir(this.moddir);
    },
    getFullPath: function(path) {
        path = new String(path);
        if (path.startsWith(this.root) || path.startsWith(this.mntdir)) {
            return path;
        }
        return this.root + path;
    },
    isExists: function(path) {
        var file = new java.io.File(this.getFullPath(path));
        return file.exists();
    },
    WriteText: function(file, text, add) {
        var dir = this.getFullPath(file);
        var writer = new java.io.PrintWriter(new java.io.BufferedWriter(new java.io.FileWriter(dir, add || false)));
        writer.write(text);
        writer.close();
    },
    ReadText: function(file) {
        var dir = this.getFullPath(file);
        try {
            var reader = java.io.BufferedReader(new java.io.FileReader(dir));
            var str;
            var text = "";
            while (str = reader.readLine()) {
                text += str + "\n";
            }
            return text;
        } catch (e) {
            return null;
        }
    },
    WriteImage: function(file, bitmap) {
        var output = new java.io.FileOutputStream(this.getFullPath(file));
        bitmap.compress(android.graphics.Bitmap.CompressFormat.PNG, 100, output);
    },
    ReadImage: function(file) {
        var options = new android.graphics.BitmapFactory.Options();
        options.inScaled = false;
        try {
            var bmp = android.graphics.BitmapFactory.decodeFile(this.getFullPath(file), options);
            return bmp;
        } catch (e) {
            return null;
        }
    },
    ReadTextAsset: function(name) {
        var bytes = Resources.getBytes(name);
        if (bytes) {
            return new java.lang.String(bytes);
        } else {
            return null;
        }
    },
    ReadImageAsset: function(name) {
        var bytes = Resources.getBytes(name);
        var options = new android.graphics.BitmapFactory.Options();
        options.inScaled = false;
        if (bytes) {
            return android.graphics.BitmapFactory.decodeByteArray(bytes, 0, bytes.length, options);
        } else {
            return null;
        }
    },
    ReadBytesAsset: function(name) {
        return Resources.getBytes(name) || null;
    },
    GetListOfDirs: function(path) {
        var dir = new java.io.File(this.getFullPath(path));
        var list = [];
        var files = dir.listFiles();
        if (!files) {
            return list;
        }
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            if (file.isDirectory()) {
                list.push(file);
            }
        }
        return list;
    },
    GetListOfFiles: function(path, ext) {
        var dir = new java.io.File(this.getFullPath(path));
        var list = [];
        var files = dir.listFiles();
        if (!files) {
            return list;
        }
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            if (!file.isDirectory()) {
                if (!ext || file.getName().endsWith(ext)) {
                    list.push(file);
                }
            }
        }
        return list;
    },
    ReadKeyValueFile: function(dir, specialSeparator) {
        var separator = specialSeparator || ":";
        var text = this.ReadText(dir);
        if (!text) {
            return {};
        }
        var lines = text.split("\n");
        var result = {};
        for (var i in lines) {
            var line = lines[i];
            var separatedLine = line.split(separator);
            if (separatedLine.length == 2) {
                result[separatedLine[0]] = separatedLine[1];
            }
        }
        return result;
    },
    WriteKeyValueFile: function(dir, data, specialSeparator) {
        var separator = specialSeparator || ":";
        var saves = [];
        for (var key in data) {
            saves.push(key + separator + data[key]);
        }
        var text = saves.join("\n");
        this.WriteText(dir, text);
    },
    ReadJSON: function(dir) {
        var textFile = this.ReadText(dir);
        try {
            return JSON.parse(textFile) || {};
        } catch (e) {
            return {};
        }
    },
    WriteJSON: function(dir, obj, beautify) {
        obj = obj || {};
        var textFile = JSON.stringify(obj, null, beautify ? "\t" : null);
        this.WriteText(dir, textFile);
    }
};
FileTools.mkworkdirs();
var Threading = {
    threads: [],
    formatFatalErrorMessage: function(error, name, priority, formatFunc) {
        var paragraf = "Fatal error detected in thread " + name + ", all mods on this thread shutted down. Exit world safely and restart. \n\n \u041a\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043a\u0430\u044f \u043e\u0448\u0438\u0431\u043a\u0430 \u0432 \u043f\u043e\u0442\u043e\u043a\u0435 " + name + ", \u0432\u0441\u0435 \u043c\u043e\u0434\u044b \u0432 \u044d\u0442\u043e\u043c \u043f\u043e\u0442\u043e\u043a\u0435 \u043e\u0442\u043a\u043b\u044e\u0447\u0435\u043d\u044b. \u0414\u043b\u044f \u0431\u0435\u0437\u043e\u043f\u0430\u0441\u043d\u043e\u0433\u043e \u0432\u044b\u0445\u043e\u0434\u0430 \u0441\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u0435 \u043c\u0438\u0440 \u0438 \u043f\u0435\u0440\u0435\u0437\u0430\u043f\u0443\u0441\u0442\u0438\u0442\u0435\u0441\u044c.\n\n";
        paragraf += "CRASH INFO:\n";
        if (formatFunc) {
            paragraf += formatFunc(error, priority);
        } else {
            paragraf += "thread name: " + name + "\nthread priority:" + priority;
        }
        paragraf += "\n\nERROR DETAILS: \n";
        paragraf += "mod: " + error.fileName + "\n";
        paragraf += "line: " + error.lineNumber + "\n";
        paragraf += "stacktrace: <font color='#CC0000'>\n" + error.message + "\n" + error.stack + "</font>";
        var log = Logger.getFormattedLog();
        return paragraf + "\n\nLOG:\n" + log;
    },
    initThread: function(name, func, priority, isErrorFatal, formatFunc) {
        var thread = new java.lang.Thread({
            run: function() {
                try {
                    android.os.Process.setThreadPriority(parseInt(priority) || 0);
                    func();
                } catch (e) {
                    var msg = "fatal error in thread " + name + ": " + e;
                    Logger.Log(msg, "ERROR");
                    Logger.LogError(e);
                    Logger.Flush();
                    if (isErrorFatal) {
                        var formattedMessage = Threading.formatFatalErrorMessage(e, name, priority, formatFunc);
                        GameAPI.dialogMessage(formattedMessage, "FATAL ERROR");
                    }
                }
                delete Threading.threads[name];
            }
        });
        Threading.threads[name] = thread;
        thread.start();
        return thread;
    },
    getThread: function(name) {
        return this.threads[name];
    }
};
var ModAPI = {
    modAPIs: {},
    registerAPI: function(name, api, descr) {
        if (!descr) {
            descr = {};
        }
        if (!descr.name) {
            descr.name = name;
        }
        if (!descr.props) {
            descr.props = {};
        }
        this.modAPIs[name] = {
            api: api,
            descr: descr
        };
        Callback.invokeCallback("API:" + name, api, descr);
    },
    requireAPI: function(name) {
        if (this.modAPIs[name]) {
            return this.modAPIs[name].api || null;
        }
        return null;
    },
    requireGlobal: function(name) {
        try {
            return eval(name);
        } catch (e) {
            Logger.Log("ModAPI.requireGlobal for " + name + " failed: " + e, "ERROR");
            return null;
        }
    },
    requireAPIdoc: function(name) {
        if (this.modAPIs[name]) {
            return this.modAPIs[name].descr || null;
        }
        return null;
    },
    requireAPIPropertyDoc: function(name, prop) {
        var descr = this.requireAPIdoc(name);
        if (descr) {
            return descr.props[prop] || null;
        }
        return null;
    },
    getModByName: function(modName) {
        logDeprecation("ModAPI.getModByName()");
        return null;
    },
    isModLoaded: function(modName) {
        logDeprecation("ModAPI.isModLoaded()");
        return false;
    },
    addAPICallback: function(apiName, func) {
        if (this.modAPIs[apiName]) {
            func(this.requireAPI(apiName));
        } else {
            Callback.addCallback("API:" + apiName, func);
        }
    },
    addModCallback: function(modName, func) {
        logDeprecation("ModAPI.addModCallback()");
        if (this.isModLoaded(modName)) {
            func(this.getModByName(modName));
        } else {
            Callback.addCallback("ModLoaded:" + modName, func);
        }
    },
    getModList: function() {
        logDeprecation("ModAPI.getModList()");
        return [];
    },
    getModPEList: function() {
        logDeprecation("ModAPI.getModPEList()");
        return [];
    },
    addTexturePack: function(path) {
        logDeprecation("ModAPI.addTexturePack()");
    },
    cloneAPI: function(api, deep) {
        var cloned = {};
        for (var name in api) {
            var prop = api[name];
            if (deep && prop && (prop.push || prop + "" == "[object Object]")) {
                cloned[name] = this.cloneAPI(prop, false);
            } else {
                cloned[name] = prop;
            }
        }
        return cloned;
    },
    inheritPrototypes: function(source, target) {
        for (var name in source) {
            if (!target[name]) {
                target[name] = source[name];
            }
        }
        return target;
    },
    cloneObject: function(source, deep, rec) {
        if (!rec) {
            rec = 0;
        }
        if (rec > 6) {
            Logger.Log("object clone failed: stackoverflow at " + source, "WARNING");
            return source;
        }
        if (source + "" == "undefined") {
            return undefined;
        }
        if (source == null) {
            return null;
        }
        var cloned = {};
        for (var name in source) {
            var prop = source[name];
            if (deep && typeof(prop) == "object") {
                cloned[name] = this.cloneObject(prop, true, rec + 1);
            } else {
                cloned[name] = prop;
            }
        }
        return cloned;
    },
    debugCloneObject: function(source, deep, rec) {
        if (!rec) {
            rec = 0;
        }
        if (rec > 5) {
            return "stackoverflow";
        }
        if (source + "" == "undefined") {
            return undefined;
        }
        if (source == null) {
            return null;
        }
        var cloned = {};
        for (var name in source) {
            var prop = source[name];
            if (deep && typeof(prop) == "object") {
                cloned[name] = this.cloneObject(prop, true, rec + 1);
            } else {
                cloned[name] = prop;
            }
        }
        return cloned;
    }
};
var SaverAPI = {
    addSavesScope: function(name, loadFunc, saveFunc) {
        return Saver.registerScopeSaver(name, {
            read: loadFunc,
            save: saveFunc
        });
    },
    registerScopeSaver: function(name, saver) {
        return Saver.registerScopeSaver(name, saver);
    },
    registerObjectSaver: function(name, saver) {
        return Saver.registerObjectSaver(name, saver);
    },
    registerObject: function(obj, saverId) {
        Saver.registerObject(obj, saverId);
    },
    setObjectIgnored: function(obj, ignore) {
        Saver.setObjectIgnored(obj, ignore);
    }
};
var GameAPI = {
    prevent: function() {
        preventDefault();
    },
    isActionPrevented: function() {
        return MCSystem.isDefaultPrevented();
    },
    message: function(msg) {
        clientMessage(msg + "");
    },
    tipMessage: function(msg) {
        tipMessage(msg + "");
    },
    dialogMessage: function(message, title) {
        GuiUtils.Run(function() {
            var ctx = getMcContext();
            var builder = android.app.AlertDialog.Builder(ctx);
            if (title) {
                builder.setTitle(title + "");
            }
            if (message) {
                message += "";
                message = message.split("\n").join("<br>");
                builder.setMessage(android.text.Html.fromHtml(message));
            }
            builder.show();
        });
    },
    setDifficulty: function(difficulty) {
        Level.setDifficulty(difficulty);
    },
    getDifficulty: function() {
        return Level.getDifficulty();
    },
    setGameMode: function(gameMode) {
        Level.setGameMode(gameMode);
    },
    getGameMode: function() {
        return Level.getGameMode();
    },
    getMinecraftVersion: function() {
        return MCSystem.getMinecraftVersion();
    },
    getEngineVersion: function() {
        return CORE_ENGINE_VERSION;
    },
    spendItemsInCreative: false,
    isDeveloperMode: false,
    isItemSpendingAllowed: function(player) {
        player = player || getPlayerEnt();
        if (Entity.getEntityTypeId(player) === 1) {
            return this.spendItemsInCreative || (new PlayerActor(player)).getGameMode() !== 1;
        }
        //print("isItemSpendingAllowed failed, invalid type=" + Entity.getEntityTypeId(player))
        return true;
    },
    simulateBackPressed: function() {
        MCSystem.simulateBackPressed();
    }
};

Callback.addCallback("CoreConfigured", function(config) {
    GameAPI.isDeveloperMode = GameAPI.spendItemsInCreative = config.getBool("developer_mode");
});

function GameObject(name, Prototype) {
    this.originalName = this.gameobjectName = name;
    this.saverId = -1;
    if (this.gameobjectName) {
        this.gameobjectName = GameObjectRegistry.genUniqueName(this.gameobjectName);
        GameObjectRegistry.registerClass(this);
    }
    this.isInstance = false;
    this.isDeployed = false;
    this.Prototype = Prototype;
    this.instantiate = function() {
        var gameobject = {};
        for (var name in this) {
            gameobject[name] = this[name];
        }
        for (var name in this.Prototype) {
            gameobject[name] = this.Prototype[name];
        }
        gameobject.isInstance = true;
        if (this.saverId != -1) {
            Saver.registerObject(this, this.saverId);
        }
        return gameobject;
    };
    this.deploy = function() {
        var gameobject = this.instantiate();
        if (gameobject.init) {
            gameobject.init.apply(gameobject, arguments);
        }
        GameObjectRegistry.deployGameObject(gameobject);
        return gameobject;
    };
    this.destroy = function() {
        if (this.isInstance) {
            this.remove = true;
            GameObjectRegistry.removeGameObject(this);
        }
    };
}
var GameObjectRegistry = {
    gameObjectTypes: {},
    activeGameObjects: {},
    genUniqueName: function(name) {
        name += "";
        while (this.gameObjectTypes[name]) {
            name = "_" + name;
        }
        return name;
    },
    registerClass: function(gameObjectClass) {
        this.gameObjectTypes[gameObjectClass.gameobjectName] = gameObjectClass;
        gameObjectClass.saverId = Saver.registerObjectSaver(gameObjectClass.gameobjectName, {
            read: function(obj) {
                var gameobject = gameObjectClass.instantiate();
                for (var name in obj) {
                    gameobject[name] = data[name];
                }
                gameobject.isDeployed = false;
                gameobject.isInstance = true;
                GameObjectRegistry.deployGameObject(gameobject);
                return null;
            },
            save: function(obj) {
                return obj;
            }
        });
    },
    deployGameObject: function(gameobject) {
        if (gameobject.isDeployed) {
            Logger.Log("trying to deploy game object (" + gameobject.originalName + ") while its already in update", "WARNING");
            return;
        }
        Updatable.addUpdatable(gameobject);
        this.addGameObject(gameobject);
        if (gameobject.loaded) {
            gameobject.loaded();
        }
        return gameobject;
    },
    addGameObject: function(gameobject) {
        if (gameobject.originalName && !gameobject.isDeployed) {
            if (!this.activeGameObjects[gameobject.originalName]) {
                this.activeGameObjects[gameobject.originalName] = [];
            }
            this.activeGameObjects[gameobject.originalName].push(gameobject);
        }
        gameobject.isDeployed = true;
    },
    removeGameObject: function(gameobject) {
        if (gameobject.originalName && gameobject.isDeployed) {
            var array = this.activeGameObjects[gameobject.originalName];
            for (var i in array) {
                if (array[i] == gameobject) {
                    array.splice(i, 1);
                    break;
                }
            }
        }
        gameobject.isDeployed = false;
    },
    resetEngine: function() {
        this.activeGameObjects = {};
    },
    getAllByType: function(type, clone) {
        if (clone) {
            var array = this.activeGameObjects[type];
            var cloned = [];
            for (var i in array) {
                cloned.push(array[i]);
            }
            return cloned;
        } else {
            return this.activeGameObjects[type] || [];
        }
    },
    callForType: function() {
        var params = [];
        for (var i in arguments) {
            params.push(arguments[i]);
        }
        var type = params.shift();
        var func = params.shift();
        var allGameObjects = this.getAllByType(type);
        for (var i = 0; i < allGameObjects.length; i++) {
            var gameobject = allGameObjects[i];
            if (gameobject[func]) {
                gameobject[func].apply(gameobject, params);
            }
        }
    },
    callForTypeSafe: function() {
        var params = [];
        for (var i in arguments) {
            params.push(arguments[i]);
        }
        var type = params.shift();
        var func = params.shift();
        var allGameObjects = this.getAllByType(type, true);
        for (var i = 0; i < allGameObjects.length; i++) {
            var gameobject = allGameObjects[i];
            if (gameobject[func]) {
                gameobject[func].apply(gameobject, params);
            }
        }
    }
};
var TileEntityBasePrototype = {
    remove: false,
    isLoaded: false,
    __initialized: false,
    networkEntityType: null,
    networkEntity: null,
    defaultValues: {},
    _runInit: function() {
        Saver.registerObject(this, this.saverId);
        this.blockSource = BlockSource.getDefaultForDimension(this.dimension);
        if (!this.blockSource) {
            this.isLoaded = false;
            return false;
        }
        if (!TileEntity.isTileEntityLoaded(this)) {
            this.isLoaded = false;
            return false;
        }
        if (this.useNetworkItemContainer) {
            this.container.setClientContainerTypeName(this.networkEntityType.getTypeName());
            // setup server side container events
            if (this.containerEvents) {
                var that = this;
                function addContainerEventListener(name, func) {
                    that.container.addServerEventListener(name, function(container, client, packetData) {
                        func.call(that, packetData, client);
                    });
                }
                for (var name in this.containerEvents) {
                    addContainerEventListener(name, this.containerEvents[name]);
                }
            }
        }
        this.networkEntity = new NetworkEntity(this.networkEntityType, this);
        this.networkData.setClients(this.networkEntity.getClients());
        this.init();
        this.load();
        this.__initialized = true;
        if (this.tick) {
            this.noupdate = false;
        } else {
            this.noupdate = true;
        }
        return true;
    },
    update: function() {
        if (this.isLoaded) {
            if (!this.__initialized) {
                if (!this._runInit()) {
                    this.noupdate = true;
                    return;
                }
            }
            if (this.tick) {
                this.tick();
            }
        }
    },
    created: function() {},
    load: function() {},
    unload: function() {},
    init: function() {},
    onCheckerTick: function(isInitialized, isLoaded, wasLoaded) {},
    click: function(id, count, data, coords) {
        return false;
    },
    destroyBlock: function(coords, player) {},
    redstone: function(params) {},
    projectileHit: function(coords, projectile) {},
    destroy: function() {
        return false;
    },
    getGuiScreen: function() {
        return null;
    },
    getScreenByName: function(name, container) {
        return null;
    },
    onItemClick: function(id, count, data, coords, player, extra) {
        if (!this.__initialized) {
            if (!this._runInit()) {
                return false;
            }
        }
        if (this.click(id, count, data, coords, player, extra)) {
            return true;
        }
        if (Entity.isSneaking(player)) {
            return false;
        }

        if (this.useNetworkItemContainer && this.getScreenName) {
            var screenName = this.getScreenName(player, coords);
            if (screenName) {
                var client = Network.getClientForPlayer(player);
                if (client) {
                    this.container.openFor(client, screenName);
                    return true;
                }
            }
        } else {
            var screen = this.getGuiScreen();
            if (screen) {
                this.container.openAs(screen);
                return true;
            }
        }

    },
    selfDestroy: function() {
        TileEntity.destroyTileEntity(this);
    },
    requireMoreLiquid: function(liquid, amount) {},

    // network built-in
    sendPacket: function(name, data) {
        this.networkEntity.send(name, data);
    },

    sendResponse: function(name, data) {
        this.networkEntity.respond(name, data);
    }
};
var TILE_ENTITY_CHECKER_ITERATIONS = 10;
var TileEntity = {
    tileEntityPrototypes: {},
    tileEntityList: [],
    resetEngine: function() {
        this.tileEntityList = [];
    },
    registerPrototype: function(blockID, customPrototype) {
        var Prototype = {};
        for (var property in TileEntityBasePrototype) {
            Prototype[property] = TileEntityBasePrototype[property];
        }
        for (var property in customPrototype) {
            Prototype[property] = customPrototype[property];
        }
        Prototype.blockID = blockID;
        this.tileEntityPrototypes[blockID] = Prototype;

        var saverName = "_TILE_ENTITY" + blockID;
        var entityTypeName = "TE-" + IDRegistry.getNameByID(blockID);

        Prototype.saverId = Saver.registerObjectSaver(saverName, {
            read: function(obj) {
                var instance = {};
                for (var property in Prototype) {
                    instance[property] = Prototype[property];
                }
                instance.data = obj.data;
                instance.x = obj.coords.x;
                instance.y = obj.coords.y;
                instance.z = obj.coords.z;
                instance.dimension = obj.coords.d || 0;
                instance.container = obj.container;
                instance.networkData = new SyncedNetworkData();
                instance.liquidStorage = obj.liquidStorage;
                if (!instance.container) {
                    instance.container = Prototype.useNetworkItemContainer ? new ItemContainer() : new UI.Container();
                }
                if (instance.container.isLegacyContainer()) {
                    if (Prototype.useNetworkItemContainer) {
                        print("[" + entityTypeName + "] upgrading legacy container")
                        instance.container = new ItemContainer(instance.container);
                    }
                } else {
                    if (!Prototype.useNetworkItemContainer) {
                        print("[" + entityTypeName + "] downgrading to legacy container")
                        instance.container = instance.container.asLegacyContainer();
                    }
                }

                try {
                    instance.container.setParent(instance);
                } catch (e) {}

                if (!instance.liquidStorage) {
                    instance.liquidStorage = new LiquidRegistry.Storage();
                }
                instance.liquidStorage.setParent(instance);
                TileEntity.addUpdatableAsTileEntity(instance);
                return instance;
            },
            save: function(obj) {
                return {
                    data: obj.data,
                    container: obj.container,
                    liquidStorage: obj.liquidStorage,
                    coords: {
                        x: obj.x,
                        y: obj.y,
                        z: obj.z,
                        d: obj.dimension
                    }
                };
            }
        });

        Prototype.networkEntityType = new NetworkEntityType(entityTypeName)
            .setClientListSetupListener(function(list, target, entity) {
                list.setupDistancePolicy(target.x + .5, target.y + .5, target.z + .5, target.dimension, target.networkVisibilityDistance || 128);
            })
            .setClientEntityAddedListener(function(entity, packet) {
                // create client tile entity from Prototype.client
                var client = {
                    x: packet.x,
                    y: packet.y,
                    z: packet.z,
                    dimension: packet.d,
                    networkData: SyncedNetworkData.getClientSyncedData(packet.sd),
                    networkEntity: entity,

                    __initialized: false,
                    noupdate: false,
                    remove: false,
                    update: function() {
                        if (!this.__initialized) {
                            this.__initialized = true;
                            this.load();
                            this.remove = this.remove || !this.tick;
                            if (this.remove) {
                                return;
                            }
                        }
                        this.tick();
                    },

                    load: function() {},
                    unload: function() {},

                    // network built-in
                    sendPacket: function(name, data) {
                        this.networkEntity.send(name, data);
                    }
                };

                if (Prototype.client) {
                    for (var name in Prototype.client) {
                        client[name] = Prototype.client[name];
                    }
                }

                // add as local updatable
                Updatable.addLocalUpdatable(client);
                return client;
            })
            .setClientEntityRemovedListener(function(target, entity) {
                target.unload();
                target.remove = true;
            })
            .setClientAddPacketFactory(function(target, entity, client) {
                return {
                    x: target.x,
                    y: target.y,
                    z: target.z,
                    d: target.dimension,
                    sd: "" + target.networkData.getName()
                }
            });


        // network: setup server side packet receivers
        if (Prototype.events) {
            function addServerPacketListener(name, func) {
                Prototype.networkEntityType.addServerPacketListener(name, function(target, entity, client, packetData, packetExtra) {
                    func.call(target, packetData, packetExtra, client);
                });
            }
            for (var name in Prototype.events) {
                addServerPacketListener(name, Prototype.events[name]);
            }
        }

        // network: setup client side packet receivers
        if (Prototype.client && Prototype.client.events) {
            function addClientPacketListener(name, func) {
                Prototype.networkEntityType.addClientPacketListener(name, function(target, entity, packetData, packetExtra) {
                    func.call(target, packetData, packetExtra);
                });
            }
            for (var name in Prototype.client.events) {
                addClientPacketListener(name, Prototype.client.events[name]);
            }
        }

        // register container screen factory
        ItemContainer.registerScreenFactory(entityTypeName, function(container, name) {
            return Prototype.getScreenByName(name, container)
        });

        // register client container events
        if (Prototype.client && Prototype.client.containerEvents) {
            for (var name in Prototype.client.containerEvents) {
                ItemContainer.addClientEventListener(entityTypeName, name, Prototype.client.containerEvents[name]);
            }
        }

        // setup redstone func for block
        if (customPrototype.redstone) {
            Block.setRedstoneTile(blockID, -1, true);
        }
    },
    getPrototype: function(blockID) {
        return this.tileEntityPrototypes[blockID];
    },
    isTileEntityBlock: function(blockID) {
        if (this.tileEntityPrototypes[blockID]) {
            return true;
        }
        return false;
    },
    createTileEntityForPrototype: function(Prototype, addToUpdate) {
        var tileEntity = {};
        for (var property in Prototype) {
            tileEntity[property] = Prototype[property];
        }
        tileEntity.data = {};
        for (var property in Prototype.defaultValues) {
            tileEntity.data[property] = Prototype.defaultValues[property];
        }
        tileEntity.networkData = new SyncedNetworkData();
        tileEntity.container = Prototype.useNetworkItemContainer ? new ItemContainer() : new UI.Container(tileEntity);
        tileEntity.liquidStorage = new LiquidRegistry.Storage(tileEntity);
        if (addToUpdate) {
            if (tileEntity.saverId && tileEntity.saverId != -1) {
                Saver.registerObject(tileEntity, tileEntity.saverId);
            }
            Updatable.addUpdatable(tileEntity);
            tileEntity.remove = false;
            tileEntity.isLoaded = true;
        }
        return tileEntity;
    },
    addTileEntity: function(x, y, z, blockSource) {
        if (this.getTileEntity(x, y, z, blockSource)) {
            return null;
        }
        var tile = blockSource ? blockSource.getBlockId(x, y, z) : getTile(x, y, z);
        var Prototype = this.getPrototype(tile);
        if (Prototype) {
            var tileEntity = this.createTileEntityForPrototype(Prototype, true);
            tileEntity.x = x;
            tileEntity.y = y;
            tileEntity.z = z;
            tileEntity.dimension = blockSource ? blockSource.getDimension() : Player.getDimension();
            this.tileEntityList.push(tileEntity);
            tileEntity.created();
            Callback.invokeCallback("TileEntityAdded", tileEntity, true);
            return tileEntity;
        }
        return null;
    },
    addUpdatableAsTileEntity: function(updatable) {
        updatable.remove = false;
        updatable.isLoaded = true;
        if (updatable.saverId && updatable.saverId != -1) {
            Saver.registerObject(updatable, updatable.saverId);
        }
        this.tileEntityList.push(updatable);
        Callback.invokeCallback("TileEntityAdded", updatable, false);
    },
    getTileEntity: function(x, y, z, blockSource) {
        for (var i in this.tileEntityList) {
            var tileEntity = this.tileEntityList[i];
            if (tileEntity.x === x && tileEntity.y === y && tileEntity.z === z) {
                if (!blockSource || blockSource.getDimension() === tileEntity.dimension) {
                    return tileEntity;
                }
            }
        }
        return null;
    },
    destroyTileEntity: function(tileEntity) {
        if (tileEntity.destroy()) {
            return false;
        }
        if (tileEntity.networkEntity) {
            tileEntity.networkEntity.remove();
            tileEntity.networkEntity = null;
        }
        tileEntity.remove = true;
        tileEntity.noupdate = false;
        tileEntity.container.close();
        if (tileEntity.container.isLegacyContainer()) {
            tileEntity.container.dropAt(tileEntity.x + 0.5, tileEntity.y + 0.5, tileEntity.z + 0.5);
        } else {
            tileEntity.container.dropAt(tileEntity.blockSource, tileEntity.x + 0.5, tileEntity.y + 0.5, tileEntity.z + 0.5);
            tileEntity.container.removeEntity();
        }
        for (var i in this.tileEntityList) {
            if (this.tileEntityList[i] == tileEntity) {
                this.tileEntityList.splice(i--, 1);
            }
        }
        Callback.invokeCallback("TileEntityRemoved", tileEntity);
        return true;
    },
    destroyTileEntityAtCoords: function(x, y, z, blockSource) {
        var tileEntity = this.getTileEntity(x, y, z, blockSource);
        if (tileEntity) {
            return this.destroyTileEntity(tileEntity);
        }
        return false;
    },
    isTileEntityLoaded: function(tileEntity) {
        /*
            this will check not only current chunk, but 5 chunks around, to exclude processing tile entities in lazy chunks
            checked chunks map:
            + +
             #
            + +
        */
        var blockSource = tileEntity.blockSource || BlockSource.getDefaultForDimension(tileEntity.dimension);
        if (!blockSource) {
            return false;
        }
        var chunkX = Math.floor(tileEntity.x / 16);
        var chunkZ = Math.floor(tileEntity.z / 16);
        return blockSource.isChunkLoaded(chunkX, chunkZ) &&
            blockSource.isChunkLoaded(chunkX + 1, chunkZ + 1) &&
            blockSource.isChunkLoaded(chunkX + 1, chunkZ - 1) &&
            blockSource.isChunkLoaded(chunkX - 1, chunkZ + 1) &&
            blockSource.isChunkLoaded(chunkX - 1, chunkZ - 1);
    },
    checkTileEntityForIndex: function(index) {
        var tileEntity = this.tileEntityList[index];
        var wasLoaded = tileEntity.isLoaded;
        tileEntity.isLoaded = this.isTileEntityLoaded(tileEntity);
        if (tileEntity.__initialized) {
            if (!wasLoaded && tileEntity.isLoaded) {
                tileEntity.load();
            }
            if (wasLoaded && !tileEntity.isLoaded) {
                tileEntity.unload();
            }
            tileEntity.noupdate = !tileEntity.tick || !tileEntity.isLoaded; // do not tick tile entities, that are not loaded, and dont have tick function
        } else if (tileEntity.isLoaded) {
            tileEntity.noupdate = false; // tile entity must update at least once to initialize
        }
        tileEntity.onCheckerTick(tileEntity.__initialized, tileEntity.isLoaded, wasLoaded);
        if (tileEntity.networkEntity) {
            tileEntity.networkEntity.refreshClients();
        }
        if (tileEntity.isLoaded && tileEntity.blockSource) {
            var isPlaced = tileEntity.blockSource.getBlockId(tileEntity.x, tileEntity.y, tileEntity.z) == tileEntity.blockID;
            if (!isPlaced) {
                this.DeployDestroyChecker(tileEntity);
            }
        }
    },
    tileEntityCheckIndex: 0,
    CheckTileEntities: function() {
        if (this.tileEntityList.length > 0) {
            for (var i = 0; i < this.tileEntityList.length / 128; i++) {
                this.tileEntityCheckIndex = (this.tileEntityCheckIndex + 1) % this.tileEntityList.length;
                this.checkTileEntityForIndex(this.tileEntityCheckIndex);
            }
        }
        return;
    },
    DeployDestroyChecker: function(tileEntity) {
        if (tileEntity.__checkInProgress) {
            return;
        }
        tileEntity.__checkInProgress = true;
        var checker = {
            tileEntity: tileEntity,
            age: 0,
            update: function() {
                var isPlaced = tileEntity.blockSource.getBlockId(this.tileEntity.x, this.tileEntity.y, this.tileEntity.z) == tileEntity.blockID;
                if (isPlaced) {
                    this.tileEntity.__checkInProgress = false;
                    this.remove = true;
                    return;
                }
                if (this.age++ > TILE_ENTITY_CHECKER_ITERATIONS) {
                    TileEntity.destroyTileEntity(this.tileEntity);
                    this.tileEntity.__checkInProgress = false;
                    this.remove = true;
                }
            }
        };
        Updatable.addUpdatable(checker);
    }
};
Callback.addCallback("tick", function() {
    TileEntity.CheckTileEntities();
});
Callback.addCallback("RedstoneSignal", function(coords, params, onLoad, region) {
    var tileEntity = TileEntity.getTileEntity(coords.x, coords.y, coords.z, region);
    if (tileEntity) {
        tileEntity.redstone(params);
    }
});
Callback.addCallback("DestroyBlock", function(coords, fullTile, player) {
    var blockSource = BlockSource.getDefaultForActor(player);
    var tileEntity = TileEntity.getTileEntity(coords.x, coords.y, coords.z, blockSource);
    if (tileEntity) {
        tileEntity.destroyBlock(coords, player);
        TileEntity.destroyTileEntity(tileEntity);
    }
});
Callback.addCallback("ProjectileHit", function(projectile, item, target) {
    var coords = target.coords;
    if (coords) {
        var blockSource = BlockSource.getDefaultForActor(projectile);
        var tileEntity = TileEntity.getTileEntity(coords.x, coords.y, coords.z, blockSource);
        if (tileEntity) {
            tileEntity.projectileHit(coords, projectile, item, target);
        }
    }
});
// TODO: probably some dead code, remove it later
var WorldGeneration = {
    generatorUpdatable: null,
    checkTile: function(x, z) {
        var checkData = Level.getData(x, 0, z);
        if (checkData != 8) {
            var checkTile = Level.getTile(x, 0, z);
            return checkTile != 0;
        }
    },
    execGeneration: function(chunk, dimension, underground) {
        var exec_func = function() {
            if (dimension == 1) {
                Callback.invokeCallback("GenerateNetherChunk", chunk.x, chunk.z);
            } else {
                if (dimension == 2) {
                    Callback.invokeCallback("GenerateEndChunk", chunk.x, chunk.z);
                } else {
                    if (underground) {
                        Callback.invokeCallback("GenerateChunkUnderground", chunk.x, chunk.z);
                    } else {
                        Callback.invokeCallback("GenerateChunk", chunk.x, chunk.z);
                    }
                }
            }
            if (underground) {
                Level.setTile(chunk.x * 16 + 1, 0, chunk.z * 16 + 1, 7, 8);
            } else {
                Level.setTile(chunk.x * 16, 0, chunk.z * 16, 7, 8);
            }
        };
        exec_func();
    },
    processChunk: function(chunk, origin, dimension) {
        var radius = Math.max(Math.abs(chunk.x - origin.x), Math.abs(chunk.z - origin.z));
        if (radius <= this.generatorUpdatable.surface_radius) {
            if (WorldGeneration.checkTile(chunk.x * 16, chunk.z * 16)) {
                WorldGeneration.execGeneration(chunk, dimension, false);
            }
        }
        if (radius <= this.generatorUpdatable.underground_radius && dimension == 0 && getPlayerY() < 64) {
            if (WorldGeneration.checkTile(chunk.x * 16 + 1, chunk.z * 16 + 1)) {
                WorldGeneration.execGeneration(chunk, dimension, true);
            }
        }
    },
    resetEngine: function() {
        if (this.generatorUpdatable) {
            this.generatorUpdatable.remove = true;
        }
        this.generatorUpdatable = {
            age: 0,
            delay: 3,
            surface_radius: 3,
            underground_radius: 1,
            thread_optimization: false,
            generation_priority: 0,
            ticking_priority: 0,
            debug: false,
            debug_max_time: 0,
            update: function() {
                if (this.age++ % this.delay > 0) {
                    return;
                }
                var radius = Math.max(this.surface_radius, this.underground_radius);
                var width = radius * 2 + 1;
                var step = (this.age / this.delay) % (width * width);
                var chunk = {
                    x: parseInt(step % width) - radius,
                    z: parseInt(step / width) - radius
                };
                var origin = {
                    x: Math.floor(getPlayerX() / 16 + 0.5),
                    z: Math.floor(getPlayerZ() / 16 + 0.5)
                };
                chunk.x += origin.x;
                chunk.z += origin.z;
                var dimension = Player.getDimension();
                if (this.debug) {
                    var timeStart = CoreAPI.Debug.sysTime();
                    WorldGeneration.processChunk(chunk, origin, dimension);
                    var timeEnd = CoreAPI.Debug.sysTime();
                    var time = (timeEnd - timeStart) / 1000;
                    if (time > this.debug_max_time) {
                        this.debug_max_time = time;
                        Logger.Log("Chunk Generation Took " + time + "s", "DEBUG");
                    }
                } else {
                    WorldGeneration.processChunk(chunk, origin, dimension);
                }
            }
        };
    }
};
var WorldGenerationUtils = {
    isTerrainBlock: function(id) {
        return GenerationUtils.isTerrainBlock(id);
    },
    isTransparentBlock: function(id) {
        return GenerationUtils.isTransparentBlock(id);
    },
    canSeeSky: function(x, y, z) {
        return GenerationUtils.canSeeSky(x, y, z);
    },
    randomXZ: function(cx, cz) {
        return {
            x: parseInt((Math.random() + cx) * 16),
            z: parseInt((Math.random() + cz) * 16)
        };
    },
    randomCoords: function(cx, cz, lowest, highest) {
        if (!lowest) {
            lowest = 0;
        }
        if (!highest) {
            highest = 128;
        }
        if (highest < lowest) {
            highest = lowest;
        }
        var coords = this.randomXZ(cx, cz);
        coords.y = parseInt(Math.random() * (highest - lowest) + lowest);
        return coords;
    },
    findSurface: function(x, y, z) {
        return {
            x: x,
            y: GenerationUtils.findSurface(x, y, z),
            z: z
        };
    },
    findHighSurface: function(x, z) {
        return this.findSurface(x, 128, z);
    },
    findLowSurface: function(x, z) {
        return this.findSurface(x, 64, z);
    },
    __lockedReal: {
        id: 0,
        data: 0
    },
    lockInBlock: function(id, data, checkerTile, checkerMode) {
        this.__lockedReal = {
            id: id,
            data: data
        };
        var id = this.__lockedReal.id;
        var data = this.__lockedReal.data;
        if (checkerTile + "" == "undefined") {
            this.setLockedBlock = function(x, y, z) {
                setTile(x, y, z, id, data);
            };
        } else {
            if (checkerMode) {
                this.setLockedBlock = function(x, y, z) {
                    if (getTile(x, y, z) != checkerTile) {
                        setTile(x, y, z, id, data);
                    }
                };
            } else {
                this.setLockedBlock = function(x, y, z) {
                    if (getTile(x, y, z) == checkerTile) {
                        setTile(x, y, z, id, data);
                    }
                };
            }
        }
    },
    setLockedBlock: function(x, y, z) {
        setTile(x, y, z, this.__lockedReal.id, this.__lockedReal.data);
    },
    genMinable: function(x, y, z, params) {
        if (!params.ratio) {
            params.ratio = 1;
        }
        if (!params.amount) {
            params.amount = params.size * params.ratio * 3;
        }
        if (!params.amount) {
            Logger.Log("failed to call old method GenerationUtils.genMinable, amount parameter is 0", "ERROR");
            return;
        }
        GenerationUtils.generateOre(x, y, z, params.id, params.data, Math.max(1, params.amount), params.noStoneCheck);
    },
    generateOre: function(x, y, z, id, data, amount, noStoneCheck) {
        GenerationUtils.generateOre(x, y, z, id, data, amount, noStoneCheck);
    },
    generateOreCustom: function(x, y, z, id, data, amount, whitelist, blocks) {
        GenerationUtils.generateOreCustom(x, y, z, id, data, amount, whitelist, blocks);
    },
    getPerlinNoise: requireMethodFromNativeAPI("api.NativeGenerationUtils", "getPerlinNoise")
};
var BLOCK_BASE_PROTOTYPE = {
    __validBlockTypes: {
        createBlock: true,
        createBlockWithRotation: true
    },
    __define: function(item) {
        var variations = this.getVariations(item);
        if (!variations) {
            Logger.Log("block prototype " + this.stringID + " has no variations, it will be replaced with missing block (1 variation)", "WARNING");
            variations = {
                name: "noname:" + this.stringID,
                texture: [
                    ["__missing", 0]
                ]
            };
        }
        var specialType = this.getSpecialType(item);
        if (!this.__validBlockTypes[this.type]) {
            Logger.Log("block prototype " + this.stringID + " has invalid type " + this.type + " it will be replaced with default", "WARNING");
            this.type = "createBlock";
        }
        BlockRegistry[this.type](this.stringID, variations, specialType);
        if (!this.isDefined) {
            var __self = this;
            if (this.getDrop) {
                BlockRegistry.registerDropFunction(this.stringID, function(blockCoords, blockID, blockData, diggingLevel, enchant) {
                    return __self.getDrop(blockCoords, blockID, blockData, diggingLevel, enchant);
                });
            }
            if (this.onPlaced) {
                BlockRegistry.registerDropFunction(this.stringID, function(coords, item, block) {
                    return __self.onPlaced(coords, item, block);
                });
            }
        }
        this.isDefined = true;
    },
    __describe: function(item) {
        if (!this.isDefined) {
            Logger.Log("block prototype cannot call __describe method: block is not defined", "ERROR");
            return;
        }
        var material = this.getMaterial(item);
        var diggingLevel = this.getDestroyLevel(item);
        if (diggingLevel > 0 && material) {
            if (material != null) {
                BlockRegistry.setBlockMaterial(this.id, material, diggingLevel);
            }
            if (this.getDrop) {
                ToolAPI.registerBlockDiggingLevel(this.id, diggingLevel);
            } else {
                BlockRegistry.setDestroyLevelForID(this.id, level);
            }
        }
        var shape = this.getShape() || [0, 0, 0, 1, 1, 1];
        if (shape.length >= 6) {
            BlockRegistry.setBlockShape(this.id, {
                x: shape[0],
                y: shape[1],
                z: shape[2]
            }, {
                x: shape[3],
                y: shape[4],
                z: shape[5]
            });
        } else {
            Logger.Log("block prototype " + this.stringID + " has invalid block shape " + shape, "WARNING");
        }
    },
    init: function() {},
    getVariations: function(item) {
        return null;
    },
    getSpecialType: function(item) {
        return null;
    },
    getCategory: function(item) {
        return null;
    },
    getEnchant: function(item) {
        return null;
    },
    getProperties: function(item) {
        return null;
    },
    isStackedByData: function(item) {
        return null;
    },
    isEnchanted: function(item) {
        return null;
    },
    getMaterial: function(item) {
        return null;
    },
    getDestroyLevel: function(item) {
        return 0;
    },
    getShape: function(item) {
        return null;
    },
    getDrop: null,
    onPlaced: null,
    onItemUsed: null
};
var BlockRegistry = {
    idSource: BlockID,
    dropFunctions: {},
    popResourceFunctions: {},
    entityInsideFunctions: {},
    entityStepOnFunctions: {},
    neighbourChangeFunctions: {},


    getNumericId: function(id) {
        if (typeof(id) == "string") {
            var _id = this.idSource[id];
            if (!_id) {
                Logger.Log("Invalid item namedID: " + id + ", -1 will be returned", "ERROR");
                return -1;
            }
            id = _id;
        }
        return parseInt(id);
    },
    createBlock: function(namedID, defineData, blockType) {
        var numericID = this.idSource[namedID];
        if (!numericID) {
            Logger.Log("Invalid block namedID: " + namedID, "ERROR");
            return false;
        }
        Block.createBlock(numericID, namedID, defineData, blockType);
        return true;
    },
    createBlockWithRotation: function(namedID, defineData, blockType) {
        var numericID = this.idSource[namedID];
        if (!numericID) {
            Logger.Log("Invalid block namedID: " + namedID, "ERROR");
            return false;
        }
        var rotatedBlocks = [];
        for (var i in defineData) {
            var block = defineData[i];
            var td = block.texture;
            var rotated = [
                [td[0], td[1], td[2], td[3], td[4], td[5]],
                [td[0], td[1], td[3], td[2], td[5], td[4]],
                [td[0], td[1], td[5], td[4], td[2], td[3]],
                [td[0], td[1], td[4], td[5], td[3], td[2]]
            ];
            for (var j in rotated) {
                rotatedBlocks.push({
                    name: block.name,
                    texture: rotated[j],
                    inCreative: block.inCreative && j == 0
                });
            }
        }
        this.createBlock(namedID, rotatedBlocks, blockType);
        this.registerPlaceFunction(namedID, function(coords, item, block, player, blockSource) {
            var yaw = Math.floor((Entity.getYaw(player) - 45) / 90);
            while (yaw < 0) {
                yaw += 4;
            }
            while (yaw > 3) {
                yaw -= 4;
            }
            var meta = {
                0: 2,
                1: 0,
                2: 3,
                3: 1
            } [yaw];
            if (canTileBeReplaced(blockSource.getBlockId(coords.relative.x, coords.relative.y, coords.relative.z))) {
                blockSource.setBlock(coords.relative.x, coords.relative.y, coords.relative.z, item.id, parseInt(item.data / 4) * 4 + meta);
            }
            return coords.relative;
        });
        this.registerDropFunction(namedID, function(coords, blockID, blockData) {
            return [
                [numericID, 1, parseInt(blockData / 4) * 4]
            ];
        });
    },
    isNativeTile: function(id) {
        return !IDRegistry.getNameByID(id);
    },
    convertBlockToItemId: function(id) {
        if (id > 255 && this.isNativeTile(id)) {
            return 255 - id;
        }
        return id;
    },
    convertItemToBlockId: function(id) {
        if (id < 0) {
            return 255 - id;
        }
        return id;
    },
    registerDropFunctionForID: function(numericID, dropFunc, level) {
        this.dropFunctions[numericID] = dropFunc;
        if (level) {
            ToolAPI.registerBlockDiggingLevel(numericID, level);
        }
        return true;
    },
    registerDropFunction: function(namedID, dropFunc, level) {
        var numericID = this.getNumericId(namedID);
        if (numericID == -1) {
            return false;
        }
        return this.registerDropFunctionForID(numericID, dropFunc, level);
    },
    defaultDropFunction: function(blockCoords, blockID, blockData, diggingLevel) {
        if (BlockRegistry.isNativeTile(blockID)) {
            return null;
        }
        return [
            [BlockRegistry.convertBlockToItemId(blockID), 1, blockData]
        ];
    },
    registerPopResourcesFunctionForID: function(numericID, func) {
        this.popResourceFunctions[numericID] = func;
        return true;
    },
    registerPopResourcesFunction(nameID, func) {
        var numericID = this.getNumericId(nameID);
        if (numericID == -1) {
            return false;
        }
        return this.registerPopResourcesFunctionForID(numericID, func);
    },
    registerEntityInsideFunctionForID: function(numericID, func) {
        Block.setEntityInsideCallbackEnabled(numericID, true);
        this.entityInsideFunctions[numericID] = func;
        return true;
    },
    registerEntityInsideFunction(nameID, func) {
        var numericID = this.getNumericId(nameID);
        if (numericID == -1) {
            return false;
        }
        return this.registerEntityInsideFunctionForID(numericID, func);
    },
    registerEntityStepOnFunctionForID: function(numericID, func) {
        Block.setEntityStepOnCallbackEnabled(numericID, true);
        this.entityStepOnFunctions[numericID] = func;
        return true;
    },
    registerEntityStepOnFunction(nameID, func) {
        var numericID = this.getNumericId(nameID);
        if (numericID == -1) {
            return false;
        }
        return this.registerEntityStepOnFunctionForID(numericID, func);
    },
    registerNeighbourChangeFunctionForID: function(numericID, func) {
        Block.setNeighbourChangeCallbackEnabled(numericID, true);
        this.neighbourChangeFunctions[numericID] = func;
        return true;
    },
    registerNeighbourChangeFunction(nameID, func) {
        var numericID = this.getNumericId(nameID);
        if (numericID == -1) {
            return false;
        }
        return this.registerNeighbourChangeFunctionForID(numericID, func);
    },
    getDropFunction: function(id) {
        return this.dropFunctions[id] || this.defaultDropFunction;
    },
    setDestroyLevelForID: function(id, level, resetData) {
        this.registerDropFunctionForID(id, function(blockCoords, blockID, blockData, diggingLevel) {
            if (BlockRegistry.isNativeTile(blockID) && level <= 0) {
                return null;
            }
            if (diggingLevel >= level) {
                return [
                    [BlockRegistry.convertBlockToItemId(blockID), 1, resetData ? 0 : blockData]
                ];
            }
        }, level);
    },
    setDestroyLevel: function(namedID, level, resetData) {
        var numericID = this.getNumericId(namedID);
        if (numericID == -1) {
            return false;
        }
        return this.setDestroyLevelForID(numericID, level, resetData);
    },
    setDestroyTime: function(namedID, time) {
        var numericID = this.getNumericId(namedID);
        if (numericID == -1) {
            return false;
        }
        return Block.setDestroyTime(numericID, time);
    },
    isSolid: function(numericID) {
        return Block.isSolid(numericID);
    },
    getDestroyTime: function(numericID) {
        return Block.getDestroyTime(numericID);
    },
    getExplosionResistance: function(numericID) {
        return Block.getExplosionResistance(numericID);
    },
    getFriction: function(numericID) {
        return Block.getFriction(numericID);
    },
    getTranslucency: function(numericID) {
        return Block.getTranslucency(numericID);
    },
    getLightLevel: function(numericID) {
        return Block.getLightLevel(numericID);
    },
    getLightOpacity: function(numericID) {
        return Block.getLightOpacity(numericID);
    },
    getRenderLayer: function(numericID) {
        return Block.getRenderLayer(numericID);
    },
    getRenderType: function(numericID) {
        return Block.getRenderType(numericID);
    },
    getBlockAtlasTextureCoords: function(name, id) {
        return Block.getBlockAtlasTextureCoords(name, id);
    },
    setTempDestroyTime: function(numericID, time) {
        Block.setTempDestroyTime(numericID, time);
    },
    setBlockMaterial: function(namedID, material, level) {
        var numericID = this.getNumericId(namedID);
        if (numericID == -1) {
            return false;
        }
        ToolAPI.registerBlockMaterial(numericID, material, level);
        return true;
    },
    getMapColor: function(numericID) {
        return Block.getMapColor(numericID);
    },
    setRedstoneTile: function(namedID, data, isRedstone) {
        var numericID = this.getNumericId(namedID);
        if (numericID == -1) {
            return false;
        }
        return Block.setRedstoneTile(numericID, data, isRedstone);
    },
    setupAsRedstoneReceiver: function(namedID, connectToRedstone) {
        var numericID = this.getNumericId(namedID);
        if (numericID == -1) {
            return false;
        }
        Block.setRedstoneTile(numericID, -1, true);
        Block.setRedstoneConnector(numericID, -1, connectToRedstone);
        Block.setRedstoneEmitter(numericID, -1, false);
    },
    setupAsRedstoneEmitter: function(namedID, connectToRedstone) {
        var numericID = this.getNumericId(namedID);
        if (numericID == -1) {
            return false;
        }
        Block.setRedstoneTile(numericID, -1, true);
        Block.setRedstoneConnector(numericID, -1, connectToRedstone);
        Block.setRedstoneEmitter(numericID, -1, true);
    },
    setupAsNonRedstoneTile: function(namedID) {
        var numericID = this.getNumericId(namedID);
        if (numericID == -1) {
            return false;
        }
        Block.setRedstoneTile(numericID, -1, false);
        Block.setRedstoneEmitter(numericID, -1, false);
        Block.setRedstoneConnector(numericID, -1, false);
    },
    onBlockDestroyed: function(coords, fullTile, byHand, player) {
        var carried = Entity.getCarriedItem(player);
        var blockSource = BlockSource.getDefaultForActor(player);
        var result = this.getBlockDropViaItem(fullTile, carried, coords, blockSource);
        if (result != null) {
            Level.destroyBlock(coords.x, coords.y, coords.z);
            if (GameAPI.isItemSpendingAllowed(player) || !byHand) {
                for (var i in result) {
                    blockSource.spawnDroppedItem(coords.x + 0.5, coords.y + 0.5, coords.z + 0.5, result[i][0], result[i][1], result[i][2], result[i][3] || null);
                }
            }
            var toolData = ToolAPI.getToolData(carried.id);
            if (toolData) {
                if (toolData.isNative && GameAPI.isItemSpendingAllowed(player)) {
                    carried.data++;
                    if (carried.data >= toolData.toolMaterial.durability) {
                        carried.id = carried.count = carried.data = 0;
                    }
                    if (byHand) {
                        Entity.setCarriedItem(player, carried.id, carried.count, carried.data, carried.extra);
                    }
                }
                if (toolData.onMineBlock) {
                    toolData.onMineBlock(coords, carried, fullTile);
                }
            }
        }
    },
    onBlockPoppedResources: function(coords, block, region, f, i) {
        var func = this.popResourceFunctions[block.id];
        if (func) {
            func(coords, block, region, f, i);
        }
    },
    onEventEntityInside: function(coords, block, entity) {
        var func = this.entityInsideFunctions[block.id];
        if (func) {
            func(coords, block, entity);
        }
    },
    onEventEntityStepOn: function(coords, block, entity) {
        var func = this.entityStepOnFunctions[block.id];
        if (func) {
            func(coords, block, entity);
        }
    },
    onEventNeigbourChanged: function(coords, block, changeCoords, region) {
        var func = this.neighbourChangeFunctions[block.id];
        if (func) {
            func(coords, block, changeCoords, region);
        }
    },
    getBlockDropViaItem: function(block, item, coords, blockSource) {
        var enchantData = ToolAPI.getEnchantExtraData(item.extra);
        var toolData = ToolAPI.getToolData(item.id);
        this.__func = this.getDropFunction(block.id);
        if (toolData && toolData.modifyEnchant) {
            toolData.modifyEnchant(enchantData, item, coords, block);
        }
        return this.__func(coords, block.id, block.data, ToolAPI.getToolLevelViaBlock(item.id, block.id), enchantData, item, blockSource);
    },
    placeFuncs: [],
    registerPlaceFunctionForID: function(block, func) {
        this.placeFuncs[block] = func;
    },
    registerPlaceFunction: function(namedID, func) {
        var numericID = this.getNumericId(namedID);
        if (numericID == -1) {
            return false;
        }
        this.registerPlaceFunctionForID(numericID, func);
    },
    getPlaceFunc: function(block) {
        return this.placeFuncs[block];
    },
    setBlockShape: function(id, pos1, pos2, data) {
        Block.setShape(id, pos1.x, pos1.y, pos1.z, pos2.x, pos2.y, pos2.z, data);
    },
    setShape: function(id, x1, y1, z1, x2, y2, z2, data) {
        Block.setShape(id, x1, y1, z1, x2, y2, z2, data);
    },
    createSpecialType: function(description, nameKey) {
        if (!nameKey) {
            nameKey = "_CE";
            var names = [];
            for (var name in description) {
                names.push(name);
            }
            names.sort();
            for (var i in names) {
                nameKey += "$" + names[i] + "$" + description[names[i]];
            }
        }
        return Block.createSpecialType(nameKey, description);
    },
    setRandomTickCallback: function(id, callback) {
        Block.setRandomTickCallback(id, callback)
    },
    setAnimateTickCallback: function(id, callback) {
        Block.setAnimateTickCallback(id, callback)
    },
    TYPE_BASE: "createBlock",
    TYPE_ROTATION: "createBlockWithRotation",
    setPrototype: function(namedID, Prototype) {
        var numericID = IDRegistry.genBlockID(namedID);
        for (var name in BLOCK_BASE_PROTOTYPE) {
            if (!Prototype[name]) {
                Prototype[name] = BLOCK_BASE_PROTOTYPE[name];
            }
        }
        Prototype.id = numericID;
        Prototype.stringID = namedID;
        Prototype.__define(null);
        Prototype.__describe(null);
        Prototype.init();
    }
};
Callback.addCallback("DestroyBlock", function(coords, fullTile, player) {
    BlockRegistry.onBlockDestroyed(coords, fullTile, true, player);
});
Callback.addCallback("PopBlockResources", function(coords, block, i, f, region) {
    BlockRegistry.onBlockPoppedResources(coords, block, region, i, f);
});
Callback.addCallback("BlockEventEntityInside", function(coords, block, entity) {
    BlockRegistry.onEventEntityInside(coords, block, entity);
});
Callback.addCallback("BlockEventEntityStepOn", function(coords, block, entity) {
    BlockRegistry.onEventEntityStepOn(coords, block, entity);
});
Callback.addCallback("BlockEventNeighbourChange", function(coords, block, changeCoords, region) {
    BlockRegistry.onEventNeigbourChanged(coords, block, changeCoords, region);
});
var ITEM_BASE_PROTOTYPE = {
    __validItemTypes: {
        createItem: true,
        createFoodItem: true,
        createArmorItem: true,
        createThrowableItem: true
    },
    __define: function(item) {
        var name = this.getName(item);
        if (!name) {
            Logger.Log("item prototype " + this.stringID + " has no name", "WARNING");
            name = "noname:" + this.stringID;
        }
        var texture = this.getTexture(item);
        if (!texture) {
            Logger.Log("item prototype " + this.stringID + " has no texture, it will be replaced with missing icon", "WARNING");
            texture = {
                name: "__missing"
            };
        }
        var params = this.getDefineParams(item);
        if (!this.__validItemTypes[this.type]) {
            Logger.Log("item prototype " + this.stringID + " has invalid type " + this.type + " it will be replaced with default", "WARNING");
            this.type = "createItem";
        }
        ItemRegistry[this.type](this.stringID, name, texture, params);
        if (!this.isDefined) {
            var __self = this;
            ItemRegistry.registerUseFunction(this.stringID, function(coords, item, block) {
                __self.onUsed(coords, item, block);
            });
            ItemRegistry.registerThrowableFunction(this.stringID, function(projectile, item, target) {
                __self.onThrowableImpact(projectile, item, target);
            });
        }
        this.isDefined = true;
    },
    __describe: function(item) {
        if (!this.isDefined) {
            Logger.Log("item prototype cannot call __describe method: item is not defined", "ERROR");
            return;
        }
        var maxDamage = this.getMaxDamage(item);
        if (maxDamage != null) {
            ItemRegistry.setMaxDamage(this.id, maxDamage);
        }
        var category = this.getCategory(item);
        if (category != null) {
            ItemRegistry.setCategory(this.id, category);
        }
        var enchant = this.getEnchant(item);
        if (enchant != null) {
            ItemRegistry.setEnchantType(this.id, enchant.type, enchant.value);
        }
        var useAnimation = this.getUseAnimation(item);
        if (useAnimation != null) {
            ItemRegistry.setUseAnimation(this.id, useAnimation);
        }
        var maxUseDuration = this.getMaxUseDuration(item);
        if (maxUseDuration != null) {
            ItemRegistry.setMaxUseDuration(this.id, maxUseDuration);
        }
        var properties = this.getProperties(item);
        if (properties) {
            properties.foil = this.isEnchanted(item);
            ItemRegistry.setProperties(this.id, properties);
        }
        var toolRender = this.isToolRender(item);
        if (toolRender != null) {
            ItemRegistry.setToolRender(this.id, toolRender);
        }
        var stackByData = this.isStackedByData(item);
        if (stackByData != null) {
            ItemRegistry.setStackedByData(this.id, stackByData);
        }
        var armorFunc = this.getArmorFuncs(item);
        if (armorFunc != null) {
            ArmorRegistry.registerFuncsForID(this.id, armorFunc);
        }
        var toolMaterial = this.getToolMaterial(item);
        var toolPrototype = this.getToolPrototype(item);
        var toolTarget = this.getToolTarget(item);
        if (toolMaterial != null && toolPrototype != null && toolTarget != null) {
            ToolAPI.registerTool(this.id, toolMaterial, toolTarget, toolPrototype);
        }
    },
    init: function() {},
    getName: function(item) {
        return null;
    },
    getTexture: function(item) {
        return null;
    },
    getDefineParams: function(item) {
        return null;
    },
    getMaxDamage: function(item) {
        return null;
    },
    getCategory: function(item) {
        return null;
    },
    getEnchant: function(item) {
        return null;
    },
    getUseAnimation: function(item) {
        return null;
    },
    getMaxUseDuration: function(item) {
        return null;
    },
    getProperties: function(item) {
        return null;
    },
    isToolRender: function(item) {
        return null;
    },
    isStackedByData: function(item) {
        return null;
    },
    isEnchanted: function(item) {
        return null;
    },
    getToolMaterial: function() {
        return null;
    },
    getToolTarget: function() {
        return null;
    },
    getToolPrototype: function() {
        return null;
    },
    getArmorFuncs: function() {
        return null;
    },
    onUsed: function(coords, item, block) {},
    onTick: function(item) {},
    onThrowableImpact: function(projectile, item, target) {}
};
var ItemRegistry = {
    idSource: ItemID,
    useFunctions: {},
    throwableFunctions: {},
    getNumericId: function(id) {
        if (typeof(id) == "string") {
            var _id = this.idSource[id];
            if (!_id) {
                Logger.Log("Invalid item namedID: " + id + ", -1 will be returned", "ERROR");
                return -1;
            }
            id = _id;
        }
        return parseInt(id);
    },
    getItemById: function(id) {
        return Item.getItemById(this.getNumericId(id));
    },
    createItem: function(namedID, name, texture, params) {
        if (!params) {
            params = {};
        }
        params.stack = params.stack || 64;
        var numericID = this.idSource[namedID];
        if (!numericID) {
            Logger.Log("Invalid item namedID: " + namedID, "ERROR");
            return false;
        }
        var item = Item.createItem(numericID, namedID, name, texture.name, texture.meta || texture.data || 0);
        item.setMaxStackSize(params.stack);
        if (!params.isTech) {
            Player.addItemCreativeInv(numericID, 1, 0);
        }
        return item;
    },
    createFoodItem: function(namedID, name, texture, params) {
        if (!params) {
            params = {};
        }
        params.stack = params.stack || 64;
        params.food = params.food || 1;
        var numericID = this.idSource[namedID];
        if (!numericID) {
            Logger.Log("Invalid item namedID: " + namedID, "ERROR");
            return null;
        }
        var item = Item.createFoodItem(numericID, namedID, name, texture.name, texture.meta || texture.data || 0, params.food);
        item.setMaxStackSize(params.stack || 64);
        if (!params.isTech) {
            Player.addItemCreativeInv(numericID, 1, 0);
        }
        return item;
    },
    createFuelItem: function(namedID, name, texture, params) {
        MCSystem.throwException("creation of fuel items is not yet supported");
    },
    createArmorItem: function(namedID, name, texture, params) {
        var validArmorTypes = {
            helmet: {
                id: 0
            },
            chestplate: {
                id: 1
            },
            leggings: {
                id: 2
            },
            boots: {
                id: 3
            }
        };
        if (!params) {
            params = {};
        }
        params.durability = params.durability || 1;
        params.armor = params.armor || 0;
        params.texture = params.texture || "textures/logo.png";
        var armorType;
        if (validArmorTypes[params.type]) {
            armorType = validArmorTypes[params.type].id;
        } else {
            Logger.Log("Invalid armor type for item " + namedID + ": " + params.type + ",use: \"helmet\", \"chestplate\", \"leggings\", \"boots\"", "ERROR");
            return;
        }
        var numericID = this.idSource[namedID];
        if (!numericID) {
            Logger.Log("Invalid item namedID: " + namedID, "ERROR");
            return false;
        }
        var item = Item.createArmorItem(numericID, namedID, name, texture.name, texture.meta || texture.data || 0, params.texture, armorType, params.armor, params.durability);
        item.setMaxStackSize(params.stack || 1);
        if (!params.isTech) {
            Player.addItemCreativeInv(numericID, 1, 0);
        }
        return item;
    },
    createThrowableItem: function(namedID, name, texture, params) {
        if (!params) {
            params = {};
        }
        params.stack = params.stack || 64;
        var numericID = this.idSource[namedID];
        if (!numericID) {
            Logger.Log("Invalid item namedID: " + namedID, "ERROR");
            return false;
        }
        var item = Item.createThrowableItem(numericID, namedID, name, texture.name, texture.meta || texture.data || 0);
        item.setMaxStackSize(params.stack || 64);
        if (!params.isTech) {
            Player.addItemCreativeInv(numericID, 1, 0);
        }
        return item;
    },
    isNativeItem: function(id) {
        return IDRegistry.isVanilla(id);
    },
    getMaxDamage: function(id) {
        return Item.getMaxDamage(id);
    },
    getMaxStack: function(id) {
        return Item.getMaxStackSize(id);
    },
    getName: function(id, data, extra) {
        return Item.getName(id, data, extra);
    },
    isValid: function(id, data) {
        return Item.isValid(id);
    },
    addToCreative: function(id, count, data, extra) {
        id = this.getNumericId(id);
        if (id == -1) {
            return;
        }
        Player.addItemCreativeInv(id, count, data, extra);
    },
    addCreativeGroup: function(name, displayedName, ids) {
        for (var i in ids) {
            Item.addToCreativeGroup(name, displayedName, ids[i]);
        }
    },
    describeItem: function(numericID, description) {
        this.setCategory(numericID, description.category || 0);
        this.setToolRender(numericID, description.toolRender);
        this.setMaxDamage(numericID, description.maxDamage || 0);
        this.setStackedByData(numericID, description.stackByData);
        this.setUseAnimation(numericID, description.useAnimation);
        if (description.properties) {
            this.setProperties(numericID, description.properties);
        }
        if (description.maxUseDuration) {
            this.setMaxUseDuration(numericID, description.maxUseDuration);
        }
        if (description.enchant) {
            this.setEnchantType(numericID, description.enchant.type, description.enchant.value);
        }
    },
    setCategory: function(id, category) {
        Item.setCategoryForId(id, category);
    },
    setEnchantType: function(id, enchant, value) {
        this.getItemById(id).setEnchantType(enchant || 0, value || 0);
    },
    setArmorDamageable: function(id, val) {
        this.getItemById(id).setArmorDamageable(val);
    },
    addRepairItemIds: function(id, items) {
        var item = this.getItemById(id);
        for (var i in items) {
            item.addRepairItem(items[i]);
        }
    },
    setToolRender: function(id, enabled) {
        this.getItemById(id).setHandEquipped(enabled);
    },
    setMaxDamage: function(id, maxdamage) {
        this.getItemById(id).setMaxDamage(maxdamage);
    },
    setGlint: function(id, enabled) {
        this.getItemById(id).setGlint(enabled);
    },
    setLiquidClip: function(id, enabled) {
        this.getItemById(id).setLiquidClip(enabled);
    },
    setStackedByData: function(id, enabled) {
        this.getItemById(id).setStackedByData(enabled);
    },
    setAllowedInOffhand: function(id, allowed) {
        this.getItemById(id).setAllowedInOffhand(allowed);
    },
    setProperties: function(id, props) {
        this.getItemById(id).setProperties(props);
    },
    setUseAnimation: function(id, animType) {
        this.getItemById(id).setUseAnimation(animType || 0);
    },
    setMaxUseDuration: function(id, duration) {
        this.getItemById(id).setMaxUseDuration(duration);
    },
    registerUseFunctionForID: function(numericID, useFunc) {
        this.useFunctions[numericID] = useFunc;
        return true;
    },
    registerUseFunction: function(namedID, useFunc) {
        var numericID = this.getNumericId(namedID);
        if (numericID == -1) {
            return false;
        }
        return this.registerUseFunctionForID(numericID, useFunc);
    },
    onItemUsed: function(coords, item, block, player) {
        this.__func = this.useFunctions[item.id];
        if (this.__func) {
            var result = this.__func(coords, item, block, player);
        }
    },
    registerThrowableFunctionForID: function(numericID, useFunc) {
        this.throwableFunctions[numericID] = useFunc;
        return true;
    },
    registerThrowableFunction: function(namedID, useFunc) {
        var numericID = this.getNumericId(namedID);
        if (numericID == -1) {
            return false;
        }
        return this.registerThrowableFunctionForID(numericID, useFunc);
    },
    onProjectileHit: function(projectile, item, target) {
        this.__func = this.throwableFunctions[item.id];
        if (this.__func) {
            var result = this.__func(projectile, item, target);
        }
    },
    iconOverrideFunctions: {},
    registerIconOverrideFunction: function(namedID, func) {
        var numericID = this.getNumericId(namedID);
        if (numericID == -1) {
            return false;
        }
        Item.setRequiresIconOverride(numericID, true);
        this.iconOverrideFunctions[numericID] = func;
    },
    onIconOverride: function(item, isModUi) {
        var func = this.iconOverrideFunctions[item.id];
        if (func) {
            var res = func(item, isModUi);
            if (res) {
                Item.overrideCurrentIcon(res.name, res.data || res.meta || 0);
            }
        }
    },
    nameOverrideFunctions: {},
    setItemNameOverrideCallbackForced: requireMethodFromNativeAPI("api.NativeAPI", "setItemNameOverrideCallbackForced"),
    registerNameOverrideFunction: function(namedID, func, preventForcing) {
        var numericID = this.getNumericId(namedID);
        if (numericID == -1) {
            return false;
        }
        if (!preventForcing) {
            this.setItemNameOverrideCallbackForced(numericID, true);
        }
        this.nameOverrideFunctions[numericID] = func;
    },
    onNameOverride: function(item, name, translation) {
        var func = this.nameOverrideFunctions[item.id];
        if (func) {
            var res = func(item, name, translation);
            if (typeof(res) == "string") {
                Item.overrideCurrentName(res);
            }
        }
    },
    noTargetUseFunctions: {},
    registerNoTargetUseFunction: function(namedID, func) {
        var numericID = this.getNumericId(namedID);
        if (numericID == -1) {
            return false;
        }
        this.noTargetUseFunctions[numericID] = func;
    },
    onUseNoTarget: function(item, player) {
        var func = this.noTargetUseFunctions[item.id];
        if (func) {
            func(item, player);
        }
    },
    usingReleasedFunctions: {},
    registerUsingReleasedFunction: function(namedID, func) {
        var numericID = this.getNumericId(namedID);
        if (numericID == -1) {
            return false;
        }
        this.usingReleasedFunctions[numericID] = func;
    },
    onUsingReleased: function(item, ticks, player) {
        var func = this.usingReleasedFunctions[item.id];
        if (func) {
            func(item, ticks, player);
        }
    },
    usingCompleteFunctions: {},
    registerUsingCompleteFunction: function(namedID, func) {
        var numericID = this.getNumericId(namedID);
        if (numericID == -1) {
            return false;
        }
        this.usingCompleteFunctions[numericID] = func;
    },
    onUsingComplete: function(item, player) {
        var func = this.usingCompleteFunctions[item.id];
        if (func) {
            func(item, player);
        }
    },
    dispenseFunctions: {},
    registerDispenseFunction: function(namedID, func) {
        var numericID = this.getNumericId(namedID);
        if (numericID == -1) {
            return false;
        }
        this.dispenseFunctions[numericID] = func;
    },
    onDispense: function(coords, item, region) {
        var func = this.dispenseFunctions[item.id];
        if (func) {
            func(coords, item, region);
        }
    },
    TYPE_BASE: "createItem",
    TYPE_FOOD: "createFoodItem",
    TYPE_ARMOR: "createArmorItem",
    TYPE_THROWABLE: "createThrowableItem",
    setPrototype: function(namedID, Prototype) {
        var numericID = IDRegistry.genItemID(namedID);
        for (var name in ITEM_BASE_PROTOTYPE) {
            if (!Prototype[name]) {
                Prototype[name] = ITEM_BASE_PROTOTYPE[name];
            }
        }
        Prototype.id = numericID;
        Prototype.stringID = namedID;
        Prototype.__define(null);
        Prototype.__describe(null);
        Prototype.init();
    },
    invokeItemUseOn: function(coords, item, noModCallback, entity) {
        var vec = coords.vec = coords.vec || {
            x: (coords.x || 0) + .5,
            y: (coords.y || 0) + .5,
            z: (coords.z || 0) + .5
        };
        if (!noModCallback) {
            var block = WorldAPI.getBlock(coords.x, coords.y, coords.z);
            Callback.invokeCallback("ItemUse", coords, item, block, false, entity);
        }
        if (noModCallback || !MCSystem.isDefaultPrevented()) {
            Item.invokeItemUseOn(item.id, item.count, item.data, item.extra, coords.x, coords.y, coords.z, coords.side || 0, vec.x, vec.y, vec.z, entity);
        }
    },
    invokeItemUseNoTarget: function(item, noModCallback) {
        if (!noModCallback) {
            Callback.invokeCallback("ItemUseNoTarget", item);
        }
        if (noModCallback || !MCSystem.isDefaultPrevented()) {
            Item.invokeItemUseNoTarget(item.id, item.count, item.data, item.extra);
        }
    }
};
Callback.addCallback("ProjectileHit", function(projectile, item, target) {
    if (item) {
        ItemRegistry.onProjectileHit(projectile, item, target);
    }
});
Callback.addCallback("ItemIconOverride", function(item, isModUi) {
    ItemRegistry.onIconOverride(item, isModUi);
});
Callback.addCallback("ItemNameOverride", function(item, name, translation) {
    ItemRegistry.onNameOverride(item, name, translation);
});
Callback.addCallback("ItemUseNoTarget", function(item, player) {
    ItemRegistry.onUseNoTarget(item, player);
});
Callback.addCallback("ItemUsingReleased", function(item, ticks, player) {
    ItemRegistry.onUsingReleased(item, ticks, player);
});
Callback.addCallback("ItemUsingComplete", function(item, player) {
    ItemRegistry.onUsingComplete(item, player);
});
Callback.addCallback("ItemDispensed", function(coords, item, region) {
    ItemRegistry.onDispense(coords, item, region);
});
var ArmorRegistry = {
    registerFuncs: function(id, funcs) {
        var id = ItemRegistry.getNumericId(id);
        if (id == -1) {
            return;
        }
        Armor.registerCallbacks(id, funcs);
    },
    preventDamaging: function(id) {
        var id = ItemRegistry.getNumericId(id);
        if (id == -1) {
            return;
        }
        Armor.preventDamaging(id);
    },
    registerOnTickListener: function(id, listener) {
        Armor.registerOnTickListener(id, listener);
    },
    registerOnHurtListener: function(id, listener) {
        Armor.registerOnHurtListener(id, listener);
    },
    registerOnTakeOnListener: function(id, listener) {
        Armor.registerOnTakeOnListener(id, listener);
    },
    registerOnTakeOffListener: function(id, listener) {
        Armor.registerOnTakeOffListener(id, listener);
    }
};
var ToolAPI = {
    blockMaterials: {},
    toolMaterials: {},
    toolData: {},
    blockData: {},
    needDamagableItemFix: false,
    addBlockMaterial: function(name, breakingMultiplier) {
        this.blockMaterials[name] = {
            multiplier: breakingMultiplier,
            name: name
        };
    },
    addToolMaterial: function(name, material) {
        if (!material.efficiency) {
            material.efficiency = 1;
        }
        if (!material.damage) {
            material.damage = 0;
        }
        if (!material.durability) {
            material.durability = 1;
        }
        if (!material.level) {
            material.level = 0;
        }
        material.name = name;
        this.toolMaterials[name] = material;
    },
    registerTool: function(id, toolMaterial, blockMaterials, params) {
        if (!params) {
            params = {};
        }
        if (!params.brokenId) {
            params.brokenId = 0;
        }
        if (!params.damage) {
            params.damage = 0;
        }
        if (typeof(toolMaterial) == "object") {
            params.toolMaterial = toolMaterial;
        } else {
            params.toolMaterial = this.toolMaterials[toolMaterial];
        }
        if (!params.toolMaterial) {
            Logger.Log("Item " + id + " cannot be registred as tool: tool material " + toolMaterial + " not found", "ERROR");
            return;
        }
        params.blockMaterials = {};
        for (var i in blockMaterials) {
            params.blockMaterials[blockMaterials[i]] = true;
        }
        if (!params.calcDestroyTime) {
            params.calcDestroyTime = function(tool, coords, block, timeData, defaultTime) {
                return defaultTime;
            };
        }
        this.toolData[id] = params;
        if (!params.isNative) {
            ItemRegistry.setMaxDamage(id, params.toolMaterial.durability);
        }
    },
    registerSword: function(id, toolMaterial, params) {
        params = params || {};
        params.isWeapon = true;
        this.registerTool(id, toolMaterial, ["fibre"], params);
    },
    registerBlockMaterial: function(uid, materialName, level, isNative) {
        var material = this.blockMaterials[materialName];
        if (!material) {
            Logger.Log("Material for block " + uid + " cannot be registred: material " + materialName + " not found", "ERROR");
            return;
        }
        this.blockData[uid] = {
            material: material,
            level: level || 0,
            isNative: isNative
        };
    },
    registerBlockDiggingLevel: function(uid, level) {
        if (this.blockData[uid]) {
            this.blockData[uid].level = level;
        } else {
            Logger.Log("Digging level for block " + uid + " cannot be registred: block has no material", "ERROR");
        }
    },
    registerBlockMaterialAsArray: function(materialName, UIDs, isNative) {
        for (var i in UIDs) {
            this.registerBlockMaterial(UIDs[i], materialName, 0, isNative);
        }
    },
    refresh: function() {},
    getBlockData: function(blockID) {
        return this.blockData[blockID];
    },
    getBlockMaterial: function(blockID) {
        var data = this.getBlockData(blockID);
        if (data) {
            return data.material;
        }
        return null;
    },
    getBlockDestroyLevel: function(blockID) {
        var data = this.getBlockData(blockID);
        if (data) {
            return data.level;
        }
        return 0;
    },
    getEnchantExtraData: function(extra) {
        var enchant = {
            silk: false,
            fortune: 0,
            efficiency: 0,
            unbreaking: 0,
            experience: 0
        }

        if (extra) {
            var enchants = extra.getEnchants();
            for (var i in enchants) {
                if (i == 15) {
                    enchant.efficiency = enchants[i];
                }
                if (i == 16) {
                    enchant.silk = true;
                }
                if (i == 17) {
                    enchant.unbreaking = enchants[i];
                }
                if (i == 18) {
                    enchant.fortune = enchants[i];
                }
            }
        }
        return enchant;
    },
    fortuneDropModifier: function(drop, level) {
        var len = drop.length;
        for (var i = 0; i < len; i++) {
            var extraCount = parseInt(Math.random() * (level + 2)) - 1;
            for (var j = 0; j < extraCount; j++) {
                drop.push(drop[i]);
            }
        }
        return drop;
    },
    getDestroyTimeViaTool: function(fullBlock, toolItem, coords, ignoreNative) {
        var baseDestroyTime = Block.getDestroyTime(fullBlock.id);
        var toolData = this.toolData[toolItem.id];
        var blockData = this.getBlockData(fullBlock.id);
        if (!blockData) {
            return baseDestroyTime;
        }
        var blockMaterial = blockData.material;
        var blockLevel = blockData.level;
        if (!blockMaterial) {
            return baseDestroyTime;
        }
        if (!toolData) {
            if (blockData.isNative) {
                return baseDestroyTime;
            } else {
                return baseDestroyTime * blockMaterial.multiplier;
            }
        }
        if (toolData.isNative && blockData.isNative && !ignoreNative) {
            return baseDestroyTime;
        }
        var canMine = toolData.blockMaterials[blockMaterial.name] && toolData.toolMaterial.level >= blockLevel;
        var enchantData = this.getEnchantExtraData(toolItem.extra);
        if (toolData.modifyEnchant) {
            toolData.modifyEnchant(enchantData, toolItem, coords, fullBlock);
        }
        var devider = 1;
        var modifier = 1;
        if (canMine) {
            devider = toolData.toolMaterial.efficiency;
            if (blockData.isNative) {
                devider *= blockMaterial.multiplier;
            }
            modifier = Math.pow(1.3, Math.pow(2, enchantData.efficiency) - 1);
        } else {
            if (!blockData.isNative) {
                baseDestroyTime *= blockMaterial.multiplier;
            }
        }
        var resultDestroyTime = toolData.calcDestroyTime(toolItem, coords, fullBlock, {
            base: baseDestroyTime,
            devider: devider,
            modifier: modifier
        }, baseDestroyTime / devider / modifier, enchantData);
        return resultDestroyTime;
    },
    getToolData: function(itemID) {
        return this.toolData[itemID] || null;
    },
    getToolLevel: function(itemID) {
        var data = this.getToolData(itemID);
        if (data) {
            return data.toolMaterial.level;
        }
        return 0;
    },
    getToolLevelViaBlock: function(itemID, blockID) {
        var toolData = this.getToolData(itemID);
        var blockMaterial = this.getBlockMaterial(blockID);
        if (!toolData || !blockMaterial) {
            return 0;
        }
        if (toolData.blockMaterials[blockMaterial.name]) {
            return toolData.toolMaterial.level;
        }
        return 0;
    },
    getCarriedToolData: function() {
        return this.getToolData(Player.getCarriedItem().id);
    },
    getCarriedToolLevel: function() {
        return this.getToolLevel(Player.getCarriedItem().id);
    },
    startDestroyHook: function(coords, block, carried) {
        var destroyTime = this.getDestroyTimeViaTool(block, carried, coords);
        if (block.id == 73) { // handle Redstone Ore
            Block.setTempDestroyTime(74, destroyTime);
        }
        if (block.id == 74) {
            Block.setTempDestroyTime(73, destroyTime);
        }
        Block.setTempDestroyTime(block.id, destroyTime);
    },
    destroyBlockHook: function(coords, block, item, player) {
        var toolData = this.getToolData(item.id);
        var enchant = this.getEnchantExtraData(item.extra);
        if (toolData && !toolData.isNative) {
            if (!(toolData.onDestroy && toolData.onDestroy(item, coords, block, player))) {
                if (toolData.modifyEnchant) {
                    toolData.modifyEnchant(enchant, item);
                }
                if ((Block.getDestroyTime(block.id) > 0 || this.getToolLevelViaBlock(item.id, block.id) > 0) && Math.random() < 1 / (enchant.unbreaking + 1)) {
                    if (GameAPI.isItemSpendingAllowed(player)) {
                        item.data++;
                        if (toolData.isWeapon) {
                            item.data++;
                        }
                    }
                }
            }
            if (item.data >= toolData.toolMaterial.durability) {
                if (!(toolData.onBroke && toolData.onBroke(item, player))) {
                    item.id = toolData.brokenId;
                    item.count = 1;
                    item.data = 0;
                    WorldAPI.playSoundAtEntity(player, "random.break", 1);
                }
            }
            Entity.setCarriedItem(player, item.id, item.count, item.data, item.extra);
        }
    },
    LastAttackTime: 0,
    playerAttackHook: function(attacker, victim, item) {
        var toolData = this.getToolData(item.id);
        var enchant = this.getEnchantExtraData(item.extra);
        var worldTime = WorldAPI.getThreadTime();
        var isTimeCorrect = this.LastAttackTime + 10 < worldTime;
        if (isTimeCorrect && toolData && !toolData.isNative && Entity.getHealth(victim) > 0) {
            if (!(toolData.onAttack && toolData.onAttack(item, victim, attacker))) {
                if (toolData.modifyEnchant) {
                    toolData.modifyEnchant(enchant, item);
                }
                if (GameAPI.isItemSpendingAllowed(attacker)) {
                    if (Math.random() < 1 / (enchant.unbreaking + 1)) {
                        item.data++;
                        if (!toolData.isWeapon) {
                            item.data++;
                        }
                    }
                }
            }
            if (item.data >= toolData.toolMaterial.durability) {
                if (!(toolData.onBroke && toolData.onBroke(item))) {
                    item.id = toolData.brokenId;
                    item.count = 1;
                    item.data = 0;
                    WorldAPI.playSoundAtEntity(attacker, "random.break", 1);
                }
            }
            var damage = toolData.damage + toolData.toolMaterial.damage;
            damage = Math.floor(damage) + (Math.random() < damage - Math.floor(damage) ? 1 : 0);
            EntityAPI.damageEntity(victim, damage, 2, {
                attacker: attacker,
                bool1: true
            });
            Entity.setCarriedItem(attacker, item.id, item.count, item.data, item.extra);
            this.LastAttackTime = worldTime;
        }
    },
    resetEngine: function() {
        this.LastAttackTime = 0;
        this.refresh();
    },
    dropExpOrbs: function(x, y, z, value) {
        Level.spawnExpOrbs(x, y, z, value);
    },
    dropOreExp: function(coords, minVal, maxVal, modifier, blockSource) {
        var value = minVal + parseInt(Math.random() * (maxVal - minVal + 1 + modifier));
        if (blockSource) {
            blockSource.spawnExpOrbs(coords.x + .5, coords.y + .5, coords.z + .5, value);
        } else {
            this.dropExpOrbs(coords.x + 0.5, coords.y + 0.5, coords.z + 0.5, value);
        }
    },
    getBlockMaterialName: function(blockID) {
        var data = this.getBlockData(blockID);
        if (data) {
            return data.material.name;
        }
        return null;
    }
};
Callback.addCallback("DestroyBlock", function(coords, block, player) {
    var carried = Entity.getCarriedItem(player);
    ToolAPI.destroyBlockHook(coords, block, carried, player);
});
Callback.addCallback("DestroyBlockStart", function(coords, block, player) {
    var carried = Entity.getCarriedItem(player);
    ToolAPI.startDestroyHook(coords, block, carried, player);
});
Callback.addCallback("PlayerAttack", function(attackerPlayer, victimEntity) {
    var carried = Entity.getCarriedItem(attackerPlayer);
    ToolAPI.playerAttackHook(attackerPlayer, victimEntity, carried);
});
Callback.addCallback("PostLoaded", function() {
    ToolAPI.resetEngine();
});

/* register native MCPE items, blocks and materials in ToolAPI */

/* --------------- tool materials ---------------- */
ToolAPI.addToolMaterial("wood", {
    level: 1,
    durability: 60,
    damage: 2,
    efficiency: 2
});

ToolAPI.addToolMaterial("stone", {
    level: 2,
    durability: 132,
    damage: 3,
    efficiency: 4
});

ToolAPI.addToolMaterial("iron", {
    level: 3,
    durability: 251,
    damage: 4,
    efficiency: 6
});

ToolAPI.addToolMaterial("golden", {
    level: 1,
    durability: 33,
    damage: 2,
    efficiency: 12
});

ToolAPI.addToolMaterial("diamond", {
    level: 4,
    durability: 1562,
    damage: 5,
    efficiency: 8
});


/* --------------- block materials ---------------- */
ToolAPI.addBlockMaterial("stone", 10 / 3); // +
ToolAPI.addBlockMaterial("wood", 1); // +
ToolAPI.addBlockMaterial("dirt", 1); // +
ToolAPI.addBlockMaterial("plant", 1); // +
ToolAPI.addBlockMaterial("fibre", 1); // +
ToolAPI.addBlockMaterial("cobweb", 10 / 3); // +
ToolAPI.addBlockMaterial("unbreaking", 999999999); // +




/* -------------- tool registration --------------- */
// pickaxes
ToolAPI.registerTool(270, "wood", ["stone"], {
    isNative: true,
    damage: 1
}); // wooden
ToolAPI.registerTool(274, "stone", ["stone"], {
    isNative: true,
    damage: 1
}); // stone
ToolAPI.registerTool(257, "iron", ["stone"], {
    isNative: true,
    damage: 1
}); // iron
ToolAPI.registerTool(285, "golden", ["stone"], {
    isNative: true,
    damage: 1
}); // golden
ToolAPI.registerTool(278, "diamond", ["stone"], {
    isNative: true,
    damage: 1
}); // diamond

// axes
ToolAPI.registerTool(271, "wood", ["wood"], {
    isNative: true,
    damage: 2
}); // wooden
ToolAPI.registerTool(275, "stone", ["wood"], {
    isNative: true,
    damage: 2
}); // stone
ToolAPI.registerTool(258, "iron", ["wood"], {
    isNative: true,
    damage: 2
}); // iron
ToolAPI.registerTool(286, "golden", ["wood"], {
    isNative: true,
    damage: 2
}); // golden
ToolAPI.registerTool(279, "diamond", ["wood"], {
    isNative: true,
    damage: 2
}); // diamond

// shovels
ToolAPI.registerTool(269, "wood", ["dirt"], {
    isNative: true,
    damage: 0
}); // wooden
ToolAPI.registerTool(273, "stone", ["dirt"], {
    isNative: true,
    damage: 0
}); // stone
ToolAPI.registerTool(256, "iron", ["dirt"], {
    isNative: true,
    damage: 0
}); // iron
ToolAPI.registerTool(284, "golden", ["dirt"], {
    isNative: true,
    damage: 0
}); // golden
ToolAPI.registerTool(277, "diamond", ["dirt"], {
    isNative: true,
    damage: 0
}); // diamond



/* -------------- block registration --------------- */
ToolAPI.registerBlockMaterialAsArray("stone", [
    1, // stone
    4, // cobblestone
    14, // gold ore
    15, // iron ore
    16, // coal ore
    21, // lapis ore
    22, // lapis block
    23, // dispenser
    24, // sandstone
    27, // power rail
    28, // trigger rail
    29, // sticky piston,
    33, // piston
    41, // gold block
    42, // iron block
    43, // double stone slab
    44, // stone slab
    45, // bricks
    48, // mossy cobblestone
    49, // obsidian
    52, // spawner
    56, // diamond ore
    57, // diamond block
    61, 62, // furnace
    66, // rail
    67, // cobble stairs
    70, // pressure plate (stone)
    71, // iron door
    73, 74, // redstone ore
    77, // stone button
    79, // ice
    87, // netherrack
    89, // glowstone
    97, // monster egg
    98, // stone brick
    101, // iron bars
    108, 109, // brick stairs
    112, 113, 114, // nether brick blocks
    116, // enchanting table
    117, // brewing stand
    118, // cauldron
    120, 121, // end blocks
    123, 124, // lamp
    125, // dropper
    126, // activator rail
    128, // sandstone stairs
    129, // emerald ore
    130, // ender chest
    133, // emerald block
    138, // beacon
    139, // cobblestone wall
    145, // anvil
    147, 148, // pressure plates
    152, // redstone block
    153, // nether quartz
    154, // hopper
    155, 156, // quartz
    159, // stained clay
    167, // iron trapdoor
    168, // prismarine
    172, // hardened clay
    173, // coal block
    174, // packed ice
    179, 180, // red sandstone
    181, // double stone slab 2
    182, // stone slab 2
    201, // purpur
    203, // purpur stairs
    205, // shulker box (undyed)
    206, // end brick
    213, // magma
    215, // red nether brick
    216, // bone block
    218, // shulker box
    219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 231, 232, 233, 234, 235, // glazed terracotta
    236, // concrete
    245, // stonecutter
    251, // observer,
    257, 258, 259, // prismarine stairs
    266, // blue ice
    387, // coral block
    412, // conduit
    417, // stone slab 3
    421, // stone slab 4
    422, // double stone slab 3
    423, // double stone slab 4
    424, 425, 426, 427, 428, 429, 430, 431, 432, 433, 434, 435, // stone stairs
    438, // smooth stone
    439, // red nether brick stairs
    440, // smooth quartz stairs
    450, // grindstone
    451, 469, // blast furnace
    452, // stonecutter
    453, 454, // smoker
    461, // bell
    463, // lantern
    465, // lava cauldron
], true);

ToolAPI.registerBlockMaterialAsArray("wood", [
    5, // planks
    17, // log1
    25, // note block
    47, // bookshelf
    53, // oak stairs
    54, // chest
    58, // workbench
    63, 68, // oak sign
    64, // door
    65, // ladder
    72, // wooden pressure plate
    85, // fence
    86, 91, // pumpkin
    96, // wooden trapdoor
    99, 100, // mushroom
    103, // melon
    107, // fence gate
    127, // cocoa
    134, 135, 136, 163, 164, // wood stairs
    143, // wooden button
    146, // trapped chest
    151, 178, // daylight sensor
    157, // wooden double slab
    158, // wooden slab
    162, // log2
    183, 184, 185, 186, 187, // fence gate 2
    193, 194, 195, 196, 197, // door 2
    260, 261, 262, 263, 264, 265, // stripped log
    395, 396, 397, 398, 399, // wooden button 2
    400, 401, 402, 403, 404, // wooden trapdoor 2
    405, 406, 407, 408, 409, // wooden pressure plate 2
    410, // carved pumpkin
    436, 437, // spruce sign
    441, 442, // birch sign
    443, 444, // acacia sign
    445, 446, // dark oak sign
    449, // lectern
    455, // cartography table
    456, // fletching table
    457, // smithing table
    458, // barrel
    459, // loom
    464, // campfire
    467, // wood
    468, // composter
], true);

ToolAPI.registerBlockMaterialAsArray("dirt", [
    2, // grass
    3, // dirt
    12, // sand
    13, // gravel
    60, // farmland
    78, 80, // snow
    82, // clay
    88, // soul sand
    110, // mycelium
    198, // grass path
    237, // concrete
    243, // podzol
], true);

ToolAPI.registerBlockMaterialAsArray("fibre", [
    30, // web
], true);


ToolAPI.registerBlockMaterialAsArray("plant", [
    6, // sapling
    18, 161, // leaves
    31, 32, // grass
    81, // cactus
    106, // vine
    111, // lilypad
    175, // tall grass
], true);


ToolAPI.registerBlockMaterialAsArray("cobweb", [
    // for older versions
], true);

ToolAPI.registerBlockMaterialAsArray("unbreaking", [
    8, 9, 10, 11, // liquid
    7, 95, // bedrock
    90, 119, 120, // portal blocks
    137, 188, 189 // command block
], true);




/* --------------- DESTROY FUNCS ---------------- */
BlockRegistry.registerDropFunctionForID(1, function(coords, id, data, level, enchant) { // stone
    if (level > 0) {
        if (data == 0 && !enchant.silk) {
            return [
                [4, 1, 0]
            ];
        } else {
            return [
                [id, 1, data]
            ];
        }
    }
    return [];
}, 1);

BlockRegistry.registerDropFunctionForID(2, function(coords, id, data, level, enchant) { //grass
    if (enchant.silk) {
        return [
            [2, 1, 0]
        ];
    }
    return [
        [3, 1, 0]
    ];
});

BlockRegistry.setDestroyLevelForID(4, 1); // cobblestone

BlockRegistry.registerDropFunctionForID(13, function(coords, id, data, level, enchant) { // gravel
    if (Math.random() < [0.1, 0.14, 0.25, 1][enchant.fortune || 0]) {
        return [
            [318, 1, 0]
        ];
    }
    return [
        [13, 1, 0]
    ];
});

BlockRegistry.setDestroyLevelForID(14, 3); // gold ore
BlockRegistry.setDestroyLevelForID(15, 2); // iron ore

BlockRegistry.registerDropFunctionForID(16, function(coords, id, data, level, enchant, item, region) { // coal ore
    if (level >= 1) {
        if (enchant.silk) {
            return [
                [id, 1, data]
            ];
        }
        ToolAPI.dropOreExp(coords, 0, 2, enchant.experience, region);
        return ToolAPI.fortuneDropModifier([
            [263, 1, 0]
        ], enchant.fortune);
    }
    return [];
}, 1);

BlockRegistry.registerDropFunctionForID(20, function(coords, id, data, level, enchant) { // glass
    if (enchant.silk) {
        return [
            [20, 1, 0]
        ];
    }
    return [];
});

BlockRegistry.registerDropFunctionForID(21, function(coords, id, data, level, enchant, item, region) { // lapis ore
    if (level >= 1) {
        if (enchant.silk) {
            return [
                [id, 1, data]
            ];
        }
        var drop = [];
        var count = 4 + parseInt(Math.random() * 6);
        for (var i = 0; i < count; i++) {
            drop.push([351, 1, 4]);
        }
        ToolAPI.dropOreExp(coords, 2, 5, enchant.experience, region);
        return ToolAPI.fortuneDropModifier(drop, enchant.fortune);
    }
    return [];
}, 2);

BlockRegistry.setDestroyLevelForID(22, 2); // lapis block
BlockRegistry.setDestroyLevelForID(23, 1, true); // dispenser
BlockRegistry.setDestroyLevelForID(24, 1); // sandstone

BlockRegistry.registerDropFunctionForID(30, function(coords, id, data, level, enchant) { // cobweb
    if (level >= 1) {
        if (enchant.silk)
            return [
                [id, 1, 0]
            ];
        return [
            [287, 1, 0]
        ];
    }
    return [];
}, 1);

BlockRegistry.setDestroyLevelForID(41, 3); // gold block
BlockRegistry.setDestroyLevelForID(42, 2); // iron block

BlockRegistry.registerDropFunctionForID(43, function(coords, id, data, level) { // double slab
    if (level >= 1) {
        return [
            [44, 1, data],
            [44, 1, data]
        ];
    }
    return [];
}, 1);

BlockRegistry.registerDropFunctionForID(44, function(coords, id, data, level) { // stone slabs
    if (level >= 1) {
        return [
            [id, 1, data % 8]
        ];
    }
    return [];
}, 1);

BlockRegistry.setDestroyLevelForID(45, 1); // bricks
BlockRegistry.setDestroyLevelForID(48, 1); // mossy cobblestone
BlockRegistry.setDestroyLevelForID(49, 4); // obsidian

BlockRegistry.registerDropFunctionForID(52, function(coords, id, data, level, enchant, item, region) { // mob spawner
    ToolAPI.dropOreExp(coords, 15, 43, enchant.experience, region);
    return [];
}, 1);

BlockRegistry.registerDropFunctionForID(56, function(coords, id, data, level, enchant, item, region) { // diamond ore
    if (level >= 3) {
        if (enchant.silk) {
            return [
                [id, 1, data]
            ];
        }
        ToolAPI.dropOreExp(coords, 3, 7, enchant.experience, region);
        return ToolAPI.fortuneDropModifier([
            [264, 1, 0]
        ], enchant.fortune);
    }
    return [];
}, 3);

BlockRegistry.setDestroyLevelForID(57, 3); // diamond block
BlockRegistry.setDestroyLevelForID(61, 1, true); // furnace
BlockRegistry.registerDropFunctionForID(62, function(coords, id, data, level, enchant) { // burning furnace
    if (level >= 1) {
        return [
            [61, 1, 0]
        ];
    }
    return [];
}, 1);

BlockRegistry.setDestroyLevelForID(67, 1, true); // cobble stairs
BlockRegistry.setDestroyLevelForID(70, 1, true); // pressure plate
BlockRegistry.registerDropFunctionForID(71, function(coords, id, data, level, enchant) { // iron door
    if (level >= 2) {
        return [
            [330, 1, 0]
        ];
    }
    return [];
}, 1);

BlockRegistry.registerDropFunctionForID(73, function(coords, id, data, level, enchant, item, region) { // redstone ore
    if (level >= 3) {
        if (enchant.silk) {
            return [
                [id, 1, data]
            ];
        }
        ToolAPI.dropOreExp(coords, 2, 5, enchant.experience, region);
        var drop = [];
        var count = 4 + parseInt(Math.random() * (2 + enchant.fortune));
        for (var i = 0; i < count; i++) {
            drop.push([331, 1, 0]);
        }
        return drop;
    }
    return [];
}, 3);

BlockRegistry.registerDropFunctionForID(74, function(coords, id, data, level, enchant, item, region) { // redstone ore
    if (level >= 3) {
        if (enchant.silk) {
            return [
                [73, 1, data]
            ];
        }
        ToolAPI.dropOreExp(coords, 2, 5, enchant.experience, region);
        var drop = [];
        var count = 4 + parseInt(Math.random() * (2 + enchant.fortune));
        for (var i = 0; i < count; i++) {
            drop.push([331, 1, 0]);
        }
        return drop;
    }
    return [];
}, 3);

BlockRegistry.registerDropFunctionForID(78, function(coords, id, data, level, enchant) { // snow layer
    if (level > 0) {
        if (data % 8 == 7) return [
            [332, 4, 0]
        ];
        if (data % 8 >= 5) return [
            [332, 3, 0]
        ];
        if (data % 8 >= 3) return [
            [332, 2, 0]
        ];
        return [
            [332, 1, 0]
        ];
    }
    return [];
});
BlockRegistry.registerDropFunctionForID(80, function(coords, id, data, level, enchant) { // snow block
    if (enchant.silk) {
        return [
            [80, 1, 0]
        ];
    }
    return [
        [332, 1, 0],
        [332, 1, 0],
        [332, 1, 0],
        [332, 1, 0]
    ];
});

BlockRegistry.setDestroyLevelForID(87, 1); // netherrack
BlockRegistry.setDestroyLevelForID(98, 1); // stone brick
BlockRegistry.setDestroyLevelForID(101, 1); // iron bars

BlockRegistry.registerDropFunctionForID(102, function(coords, id, data, level, enchant) { // glass pane
    if (enchant.silk) {
        return [
            [102, 1, 0]
        ];
    }
    return [];
});

BlockRegistry.setDestroyLevelForID(108, 1, true); // brick stairs
BlockRegistry.setDestroyLevelForID(109, 1, true); // stone brick stairs

BlockRegistry.registerDropFunctionForID(110, function(coords, id, data, level, enchant) { // mycelium
    if (enchant.silk) {
        return [
            [110, 1, 0]
        ];
    }
    return [
        [3, 1, 0]
    ];
});

BlockRegistry.setDestroyLevelForID(112, 1); // nether brick
BlockRegistry.setDestroyLevelForID(113, 1); // nether brick fence
BlockRegistry.setDestroyLevelForID(114, 1, true); // nether brick stairs
BlockRegistry.setDestroyLevelForID(116, 1); // ench table

BlockRegistry.registerDropFunctionForID(117, function(coords, id, data, level) { // brewing stand
    if (level >= 1) {
        return [
            [379, 1, 0]
        ]
    }
    return [];
}, 1);

BlockRegistry.registerDropFunctionForID(118, function(coords, id, data, level) { // cauldron
    if (level >= 1) {
        return [
            [380, 1, 0]
        ]
    }
    return [];
}, 1);

BlockRegistry.setDestroyLevelForID(121, 1); // end stone
BlockRegistry.setDestroyLevelForID(125, 1, true); // dropper
BlockRegistry.setDestroyLevelForID(128, 1, true); // sandstone stairs

BlockRegistry.registerDropFunctionForID(129, function(coords, id, data, level, enchant, item, region) { // emerald ore
    if (level >= 3) {
        if (enchant.silk) {
            return [
                [id, 1, data]
            ];
        }
        ToolAPI.dropOreExp(coords, 3, 7, enchant.experience, region);
        return ToolAPI.fortuneDropModifier([
            [388, 1, 0]
        ], enchant.fortune);
    }
    return [];
}, 3);

BlockRegistry.registerDropFunctionForID(130, function(coords, id, data, level, enchant) { // ender chest
    if (level >= 1) {
        if (enchant.silk) {
            return [
                [id, 1, 0]
            ];
        }
        return [
            [49, 8, 0]
        ]
    }
    return [];
}, 1);

BlockRegistry.setDestroyLevelForID(133, 3); // emerald block
BlockRegistry.setDestroyLevelForID(139, 1); // cobblestone wall
BlockRegistry.setDestroyLevelForID(145, 1); // anvil
BlockRegistry.setDestroyLevelForID(147, 1, true); // pressure plate
BlockRegistry.setDestroyLevelForID(148, 1, true); // pressure plate
BlockRegistry.setDestroyLevelForID(152, 1); // redstone block

BlockRegistry.registerDropFunctionForID(153, function(coords, id, data, level, enchant, item, region) { // nether quartz ore
    if (level >= 2) {
        if (enchant.silk) {
            return [
                [id, 1, data]
            ];
        }
        ToolAPI.dropOreExp(coords, 2, 5, enchant.experience, region);
        return ToolAPI.fortuneDropModifier([
            [406, 1, 0]
        ], enchant.fortune);
    }
    return [];
}, 2);

BlockRegistry.registerDropFunctionForID(154, function(coords, id, data, level) { // hopper
    if (level >= 1) {
        return [
            [410, 1, 0]
        ]
    }
    return [];
}, 1);

BlockRegistry.setDestroyLevelForID(155, 1); // quartz
BlockRegistry.setDestroyLevelForID(156, 1, true); // quartz stairs
BlockRegistry.setDestroyLevelForID(159, 1); // stained clay

BlockRegistry.registerDropFunctionForID(160, function(coords, id, data, level, enchant) { // stained glass pane
    if (enchant.silk) {
        return [
            [id, 1, data]
        ];
    }
    return [];
});

BlockRegistry.setDestroyLevelForID(167, 2, true); // iron trapdoor
BlockRegistry.setDestroyLevelForID(168, 1); // prismarine

BlockRegistry.registerDropFunctionForID(169, function(coords, id, data, level, enchant) { // sea lantern
    if (enchant.silk) {
        return [
            [id, 1, data]
        ];
    }
    var drop = [];
    var count = 2 + parseInt(Math.random() * (2 + enchant.fortune));
    if (count > 5) count = 5;
    for (var i = 0; i < count; i++) {
        drop.push([422, 1, 0]);
    }
    return drop;
});

BlockRegistry.setDestroyLevelForID(172, 1); // hardened clay
BlockRegistry.setDestroyLevelForID(173, 1); // coal block
BlockRegistry.setDestroyLevelForID(179, 1); // red sandstone
BlockRegistry.setDestroyLevelForID(180, 1, true); // red sandstone stairs

BlockRegistry.registerDropFunctionForID(181, function(coords, id, data, level, enchant) { // double slab 2
    if (level >= 1) {
        return [
            [182, 1, data],
            [182, 1, data]
        ];
    }
    return [];
}, 1);

BlockRegistry.registerDropFunctionForID(182, function(coords, id, data, level, enchant) { // stone slab 2
    if (level >= 1) {
        return [
            [id, 1, data % 8]
        ];
    }
    return [];
}, 1);

BlockRegistry.registerDropFunctionForID(194, function(coords, id, data, level, enchant) { // packed ice
    if (level >= 1 && enchant.silk) {
        return [
            [194, 1, data]
        ];
    }
    return [];
});

BlockRegistry.registerDropFunctionForID(198, function(coords, id, data, level, enchant) { // grass path
    if (enchant.silk) {
        return [
            [198, 1, 0]
        ];
    }
    return [
        [3, 1, 0]
    ];
});

BlockRegistry.setDestroyLevelForID(201, 1); // purpur
BlockRegistry.setDestroyLevelForID(203, 1, true); // purpur stairs
BlockRegistry.setDestroyLevelForID(206, 1); // end brick
BlockRegistry.setDestroyLevelForID(213, 1); // magma
BlockRegistry.setDestroyLevelForID(215, 1); // red nether brick
BlockRegistry.setDestroyLevelForID(216, 1, true); // bone block

// glazed terracotta
BlockRegistry.setDestroyLevelForID(219, 1, true);
BlockRegistry.setDestroyLevelForID(220, 1, true);
BlockRegistry.setDestroyLevelForID(221, 1, true);
BlockRegistry.setDestroyLevelForID(222, 1, true);
BlockRegistry.setDestroyLevelForID(223, 1, true);
BlockRegistry.setDestroyLevelForID(224, 1, true);
BlockRegistry.setDestroyLevelForID(225, 1, true);
BlockRegistry.setDestroyLevelForID(226, 1, true);
BlockRegistry.setDestroyLevelForID(227, 1, true);
BlockRegistry.setDestroyLevelForID(228, 1, true);
BlockRegistry.setDestroyLevelForID(229, 1, true);
BlockRegistry.setDestroyLevelForID(231, 1, true);
BlockRegistry.setDestroyLevelForID(232, 1, true);
BlockRegistry.setDestroyLevelForID(233, 1, true);
BlockRegistry.setDestroyLevelForID(234, 1, true);
BlockRegistry.setDestroyLevelForID(235, 1, true);

BlockRegistry.setDestroyLevelForID(236, 1); // concrete

BlockRegistry.registerDropFunctionForID(241, function(coords, id, data, level, enchant) { // stained glass
    if (enchant.silk) {
        return [
            [id, 1, data]
        ];
    }
    return [];
});

BlockRegistry.setDestroyLevelForID(245, 1); // stonecutter
BlockRegistry.setDestroyLevelForID(251, 1, true); // observer

BlockRegistry.registerDropFunctionForID(243, function(coords, id, data, level, enchant) { // podzol
    if (enchant.silk) {
        return [
            [243, 1, 0]
        ];
    }
    return [
        [3, 1, 0]
    ];
});

// prismarine stairs
BlockRegistry.setDestroyLevelForID(257, 1, true);
BlockRegistry.setDestroyLevelForID(258, 1, true);
BlockRegistry.setDestroyLevelForID(259, 1, true);

BlockRegistry.registerDropFunctionForID(266, function(coords, id, data, level, enchant) { // blue ice
    if (level >= 1 && enchant.silk) {
        return [
            [BlockRegistry.convertBlockToItemId(266), 1, data]
        ];
    }
    return [];
});

BlockRegistry.registerDropFunctionForID(386, function(coords, id, data, level, enchant) { // coral
    if (level >= 1 && enchant.silk) {
        return [
            [BlockRegistry.convertBlockToItemId(386), 1, data]
        ];
    }
    return [];
});

BlockRegistry.registerDropFunctionForID(387, function(coords, id, data, level, enchant) { // coral block
    if (level >= 1) {
        if (enchant.silk) {
            return [
                [-132, 1, data]
            ];
        }
        return [
            [BlockRegistry.convertBlockToItemId(387), 1, data + 8]
        ];
    }
    return [];
});

BlockRegistry.registerDropFunctionForID(388, function(coords, id, data, level, enchant) { // coral fan
    if (level >= 1 && enchant.silk) {
        return [
            [BlockRegistry.convertBlockToItemId(388), 1, data % 8]
        ];
    }
    return [];
});

BlockRegistry.registerDropFunctionForID(389, function(coords, id, data, level, enchant) { // dead coral fan
    if (level >= 1 && enchant.silk) {
        return [
            [BlockRegistry.convertBlockToItemId(389), 1, data % 8]
        ];
    }
    return [];
});

BlockRegistry.registerDropFunctionForID(390, function(coords, id, data, level, enchant) { // wall coral fan
    if (level >= 1 && enchant.silk) {
        var itemID = BlockRegistry.convertBlockToItemId((data % 4 < 2) ? 388 : 389);
        return [
            [itemID, 1, data % 2]
        ];
    }
    return [];
});

BlockRegistry.registerDropFunctionForID(391, function(coords, id, data, level, enchant) { // wall coral fan 2
    if (level >= 1 && enchant.silk) {
        var itemID = BlockRegistry.convertBlockToItemId((data % 4 < 2) ? 388 : 389);
        return [
            [itemID, 1, data % 2 + 2]
        ];
    }
    return [];
});

BlockRegistry.registerDropFunctionForID(392, function(coords, id, data, level, enchant) { // wall coral fan 3
    if (level >= 1 && enchant.silk) {
        var itemID = BlockRegistry.convertBlockToItemId((data % 4 < 2) ? 388 : 389);
        return [
            [itemID, 1, 4]
        ];
    }
    return [];
});

BlockRegistry.registerDropFunctionForID(417, function(coords, id, data, level, enchant) { // stone slab 3
    if (level >= 1) {
        return [
            [-162, 1, data % 8]
        ];
    }
    return [];
}, 1);

BlockRegistry.registerDropFunctionForID(421, function(coords, id, data, level, enchant) { // stone slab 4
    if (level >= 1) {
        return [
            [-166, 1, data % 8]
        ];
    }
    return [];
}, 1);

BlockRegistry.registerDropFunctionForID(422, function(coords, id, data, level, enchant) { // double slab 3
    if (level >= 1) {
        return [
            [-162, 1, data],
            [-162, 1, data]
        ];
    }
    return [];
}, 1);

BlockRegistry.registerDropFunctionForID(423, function(coords, id, data, level, enchant) { // double slab 4
    if (level >= 1) {
        return [
            [-166, 1, data],
            [-166, 1, data]
        ];
    }
    return [];
}, 1);

// stone stairs
BlockRegistry.setDestroyLevelForID(424, 1, true);
BlockRegistry.setDestroyLevelForID(425, 1, true);
BlockRegistry.setDestroyLevelForID(426, 1, true);
BlockRegistry.setDestroyLevelForID(427, 1, true);
BlockRegistry.setDestroyLevelForID(428, 1, true);
BlockRegistry.setDestroyLevelForID(429, 1, true);
BlockRegistry.setDestroyLevelForID(430, 1, true);
BlockRegistry.setDestroyLevelForID(431, 1, true);
BlockRegistry.setDestroyLevelForID(432, 1, true);
BlockRegistry.setDestroyLevelForID(433, 1, true);
BlockRegistry.setDestroyLevelForID(434, 1, true);
BlockRegistry.setDestroyLevelForID(435, 1, true);

BlockRegistry.setDestroyLevelForID(438, 1); // smooth stone
BlockRegistry.setDestroyLevelForID(439, 1, true); // red nether brick stairs
BlockRegistry.setDestroyLevelForID(440, 1, true); // smooth quartz stairs
BlockRegistry.setDestroyLevelForID(450, 1, true); // grindstone
BlockRegistry.setDestroyLevelForID(451, 1, true); // blast furnace
BlockRegistry.setDestroyLevelForID(452, 1, true); // stonecutter
BlockRegistry.setDestroyLevelForID(453, 1, true); // smoker
BlockRegistry.registerDropFunctionForID(454, function(coords, id, data, level) { // lit smoker
    if (level >= 1) {
        return [
            [BlockRegistry.convertBlockToItemId(453), 1, 0]
        ];
    }
    return [];
}, 1);
BlockRegistry.setDestroyLevelForID(461, 1, true); // bell
BlockRegistry.setDestroyLevelForID(463, 1, true); // lantern

BlockRegistry.registerDropFunctionForID(465, function(coords, id, data, level) { // lava cauldron
    if (level >= 1) {
        return [
            [380, 1, 0]
        ]
    }
    return [];
}, 1);

BlockRegistry.registerDropFunctionForID(469, function(coords, id, data, level) { // lit blast furnace
    if (level >= 1) {
        return [
            [BlockRegistry.convertBlockToItemId(451), 1, 0]
        ];
    }
    return [];
}, 1);

// ice
Callback.addCallback("DestroyBlock", function(coords, block, player) {
    if (block.id == 79) {
        var item = Entity.getCarriedItem(player);
        var enchant = ToolAPI.getEnchantExtraData(item.extra);
        var toolData = ToolAPI.getToolData(item.id);
        if (toolData && !toolData.isNative && GameAPI.isItemSpendingAllowed(player)) {
            if (toolData && toolData.modifyEnchant) {
                toolData.modifyEnchant(enchant, item);
            }
            if (ToolAPI.getToolLevelViaBlock(item.id, block.id) > 0 && enchant.silk) {
                var blockSource = BlockSource.getDefaultForActor(player);
                blockSource.destroyBlock(coords.x, coords.y, coords.z);
                blockSource.spawnDroppedItem(coords.x + .5, coords.y + .5, coords.z + .5, block.id, 1, 0, null);
            }
        }
    }
});



var LiquidRegistry = {
    liquidStorageSaverId: Saver.registerObjectSaver("_liquidStorage", {
        read: function(obj) {
            var storage = new LiquidRegistry.Storage();
            storage.read(obj);
            return storage;
        },
        save: function(obj) {
            if (obj) {
                return obj.save();
            }
        }
    }),
    liquids: {},
    registerLiquid: function(key, name, uiTextures, modelTextures) {
        if (this.liquids[key]) {
            Logger.Log("liquid key " + key + " is not unique, new liquid will replace old one", "WARNING");
        }
        this.liquids[key] = {
            key: key,
            name: name || key,
            uiTextures: uiTextures || [],
            uiCache: {},
            modelTextures: modelTextures || [],
            addUITexture: function(name) {
                this.uiTextures.push(name);
            },
            addModelTexture: function(name) {
                this.modelTextures.push(name);
            }
        };
    },
    getLiquidData: function(key) {
        return this.liquids[key];
    },
    isExists: function(key) {
        if (this.liquids[key]) {
            return true;
        }
        return false;
    },
    getLiquidName: function(key) {
        if (this.liquids[key]) {
            return this.liquids[key].name;
        }
    },
    getLiquidUITexture: function(key, width, height) {
        var liquid = this.getLiquidData(key);
        if (liquid) {
            if (width && height) {
                var ratio = width / height;
                var best = {
                    name: null,
                    delta: 99999
                };
                for (var i in liquid.uiTextures) {
                    var name = liquid.uiTextures[i];
                    var bitmap = UI.TextureSource.getNullable(name);
                    if (bitmap) {
                        var delta = Math.abs(bitmap.width / bitmap.height - ratio);
                        if (delta < best.delta) {
                            best.delta = delta;
                            best.name = name;
                        }
                    }
                }
                return best.name || "missing_texture";
            } else {
                return liquid.uiTextures[0] || "missing_texture";
            }
        }
        return "missing_texture";
    },
    getLiquidUIBitmap: function(key, width, height) {
        var liquid = this.getLiquidData(key);
        if (liquid) {
            var ratio = width / height;
            var best = {
                bitmap: null,
                delta: 99999
            };
            for (var i in liquid.uiTextures) {
                var name = liquid.uiTextures[i];
                var bitmap = UI.TextureSource.get(name);
                if (bitmap) {
                    var delta = Math.abs(bitmap.width / bitmap.height - ratio);
                    if (delta < best.delta) {
                        best.delta = delta;
                        best.bitmap = bitmap;
                    }
                }
            }
            if (best.bitmap) {
                if (width >= 1 && height >= 1) {
                    var bitmap = android.graphics.Bitmap.createScaledBitmap(best.bitmap, width, height, false);
                    return bitmap;
                }
            }
        }
        return UI.TextureSource.get("missing_texture");
    },
    FullByEmpty: {},
    EmptyByFull: {},
    registerItem: function(liquid, empty, full) {
        if (!this.getLiquidData(liquid) || !empty || !full) {
            Logger.Log("cannot register items for liquid " + key + ": some params are missing or invalid", "ERROR");
            return;
        }
        this.FullByEmpty[empty.id + ":" + empty.data + ":" + liquid] = {
            id: full.id,
            data: full.data
        };
        this.EmptyByFull[full.id + ":" + full.data] = {
            id: empty.id,
            data: empty.data,
            liquid: liquid
        };
    },
    getEmptyItem: function(id, data) {
        if (this.EmptyByFull[id + ":" + data]) {
            return this.EmptyByFull[id + ":" + data];
        }
        if (this.EmptyByFull[id + ":-1"]) {
            return this.EmptyByFull[id + ":-1"];
        }
    },
    getItemLiquid: function(id, data) {
        var empty = this.getEmptyItem(id, data);
        if (empty) {
            return empty.liquid;
        }
    },
    getFullItem: function(id, data, liquid) {
        if (this.FullByEmpty[id + ":" + data + ":" + liquid]) {
            return this.FullByEmpty[id + ":" + data + ":" + liquid];
        }
        if (this.FullByEmpty[id + ":-1:" + liquid]) {
            return this.FullByEmpty[id + ":-1:" + liquid];
        }
    },
    Storage: function(tileEntity) {
        this.liquidAmounts = {};
        this.liquidLimits = {};
        this.tileEntity = tileEntity;
        Saver.registerObject(this, LiquidRegistry.liquidStorageSaverId);
        this.setParent = function(obj) {
            this.tileEntity = obj;
        };
        this.getParent = function(obj) {
            return this.tileEntity;
        };
        this.hasDataFor = function(liquid) {
            return this.liquidAmounts[liquid] + "" != "undefined";
        };
        this.setLimit = function(liquid, limit) {
            if (liquid) {
                this.liquidLimits[liquid] = limit;
            } else {
                this.liquidLimits.__global = limit;
            }
        };
        this.getLimit = function(liquid) {
            return this.liquidLimits[liquid] || this.liquidLimits.__global || 99999999;
        };
        this.getAmount = function(liquid) {
            return this.liquidAmounts[liquid] || 0;
        };
        this.getRelativeAmount = function(liquid) {
            return this.getAmount(liquid) / this.getLimit(liquid);
        };
        this._setContainerScale = function(container, scale, liquid, val) {
            var size = container.getBinding(scale, "element_rect");
            if (!size) {
                return;
            }
            var texture = LiquidRegistry.getLiquidUITexture(liquid, size.width(), size.height());
            container.setBinding(scale, "texture", texture);
            container.setBinding(scale, "value", val);
        };
        this.updateUiScale = function(scale, liquid, container) {
            if (container) {
                this._setContainerScale(container, scale, liquid, this.getRelativeAmount(liquid));
            } else {
                if (this.tileEntity && this.tileEntity.container) {
                    this._setContainerScale(this.tileEntity.container, scale, liquid, this.getRelativeAmount(liquid));
                }
            }
        };
        this.setAmount = function(liquid, amount) {
            this.liquidAmounts[liquid] = amount;
        };
        this.getLiquidStored = function() {
            for (var liquid in this.liquidAmounts) {
                if (this.liquidAmounts[liquid] > 0) {
                    return liquid;
                }
            }
            return null;
        };
        this.isFull = function(liquid) {
            if (liquid) {
                return this.getLimit(liquid) <= this.liquidAmounts[liquid];
            } else {
                for (var name in this.liquidAmounts) {
                    if (name && !this.isFull(name)) {
                        return false;
                    }
                }
                return true;
            }
        };
        this.isEmpty = function(liquid) {
            if (liquid) {
                return this.liquidAmounts[liquid] <= 0;
            } else {
                for (var name in this.liquidAmounts) {
                    if (name && !this.isEmpty(name)) {
                        return false;
                    }
                }
                return true;
            }
        };
        this.addLiquid = function(liquid, amount, onlyFullAmount) {
            var limit = this.getLimit(liquid);
            var stored = this.getAmount(liquid);
            var result = stored + amount;
            var left = result - Math.min(limit, result);
            if (!onlyFullAmount || left <= 0) {
                this.setAmount(liquid, result - left);
                return Math.max(left, 0);
            }
            return amount;
        };
        this.getLiquid_flag = false;
        this.getLiquid = function(liquid, amount, onlyFullAmount) {
            var stored = this.getAmount(liquid);
            if (!this.getLiquid_flag && this.tileEntity && stored < amount) {
                this.getLiquid_flag = true;
                this.tileEntity.requireMoreLiquid(liquid, amount - stored);
                this.getLiquid_flag = false;
                stored = this.getAmount(liquid);
            }
            var got = Math.min(stored, amount);
            if (!onlyFullAmount || got >= amount) {
                this.setAmount(liquid, stored - got);
                return got;
            }
            return 0;
        };
        this.save = function() {
            return {
                amounts: this.liquidAmounts,
                limits: this.liquidLimits
            };
        };
        this.read = function(data) {
            if (data) {
                if (data.amounts) {
                    this.liquidAmounts = data.amounts;
                }
                if (data.limits) {
                    this.liquidLimits = data.limits;
                }
            }
        };
    }
};
LiquidRegistry.registerLiquid("water", "water", ["_liquid_water_texture_0"]);
LiquidRegistry.registerLiquid("lava", "lava", ["_liquid_lava_texture_0"]);
LiquidRegistry.registerLiquid("milk", "milk", ["_liquid_milk_texture_0"]);
LiquidRegistry.registerItem("water", {
    id: 325,
    data: 0
}, {
    id: 325,
    data: 8
});
LiquidRegistry.registerItem("water", {
    id: 374,
    data: 0
}, {
    id: 373,
    data: 0
});
LiquidRegistry.registerItem("lava", {
    id: 325,
    data: 0
}, {
    id: 325,
    data: 10
});
LiquidRegistry.registerItem("milk", {
    id: 325,
    data: 0
}, {
    id: 325,
    data: 1
});
var NativeAPI_setTile = requireMethodFromNativeAPI("api.NativeAPI", "setTile");
var NativeAPI_getTileAndData = requireMethodFromNativeAPI("api.NativeAPI", "getTileAndData");
var NativeAPI_getTile = requireMethodFromNativeAPI("api.NativeAPI", "getTile");
var NativeAPI_getData = requireMethodFromNativeAPI("api.NativeAPI", "getData");
var WorldAPI = {
    isLoaded: false,
    setLoaded: function(isLoaded) {
        this.isLoaded = isLoaded;
        var mode = null;
        if (this.isLoaded) {
            mode = this.__inworld;
            Logger.Log("World API switched into in-game mode", "API");
        } else {
            mode = this.__inmenu;
            Logger.Log("World API switched into in-menu mode", "API");
        }
        for (var name in mode) {
            this[name] = mode[name];
        }
    },
    isWorldLoaded: function() {
        return this.isLoaded;
    },
    getThreadTime: function() {
        return Updatable.getSyncTime();
    },
    getRelativeCoords: function(x, y, z, side) {
        var dir = this.getVectorByBlockSide(side) || {x: 0, y: 0, z: 0};
        return {
            x: x + dir.x,
            y: y + dir.y,
            z: z + dir.z
        };
    },
    getVectorByBlockSide: function(side) {
        var directions = [{
            x: 0,
            y: -1,
            z: 0
        }, // down
            {
                x: 0,
                y: 1,
                z: 0
            }, // up
            {
                x: 0,
                y: 0,
                z: -1
            }, // east
            {
                x: 0,
                y: 0,
                z: 1
            }, // west
            {
                x: -1,
                y: 0,
                z: 0
            }, // south
            {
                x: 1,
                y: 0,
                z: 0
            } // north
        ];
        return directions[side];
    },
    getInverseBlockSide: function(side) {
        return side ^ 1;
    },
    canTileBeReplaced: canTileBeReplaced,
    doesVanillaTileHasUI: doesVanillaTileHasUI,
    setBlockUpdateType: requireMethodFromNativeAPI("api.NativeAPI", "setTileUpdateType"),
    setBlockUpdateAllowed: requireMethodFromNativeAPI("api.NativeAPI", "setTileUpdateAllowed"),
    setBlockChangeCallbackEnabled: function(id, enabled) {
        Level.setBlockChangeCallbackEnabled(id, enabled);
    },
    blockChangeCallbacks: [],
    registerBlockChangeCallback: function(ids, callback) {
        if (!Array.isArray(ids)) {
            ids = [ids];
        }
        for (var i in ids) {
            var id = ids[i];
            if (typeof(id) == "string") {
                var numericID = BlockRegistry.getNumericId(id);
                if (numericID == -1) {
                    Logger.Log("invalid block name id " + id);
                    continue;
                }
                id = numericID;
            }
            Level.setBlockChangeCallbackEnabled(id, true);
            var callbacks = this.blockChangeCallbacks[id] || [];
            callbacks.push(callback);
            this.blockChangeCallbacks[id] = callbacks;
        }
    },
    onBlockChanged: function(coords, block1, block2, region, int1, int2) {
        var callbacks = this.blockChangeCallbacks[block1.id];
        if (callbacks) {
            for (var i in callbacks) {
                callbacks[i](coords, block1, block2, region, int1, int2);
            }
        }
        if (block1.id != block2.id) {
            callbacks = this.blockChangeCallbacks[block2.id];
            if (callbacks) {
                for (var i in callbacks) {
                    callbacks[i](coords, block1, block2, region, int1, int2);
                }
            }
        }
    },
    addGenerationCallback(targetCallback, callback, uniqueHashStr) {
        if (!uniqueHashStr) {
            uniqueHashStr = "hash:" + callback;
        }
        var hash = 0;
        for (var i = 0; i < uniqueHashStr.length; i++) {
            var chr = uniqueHashStr.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0;
        }
        Callback.addCallback(targetCallback, function(chunkX, chunkZ, seededRandom, dimensionId, chunkSeed, worldSeed, dimensionSeed) {
            var callbackSeed = chunkSeed ^ hash;
            seededRandom.setSeed(callbackSeed);
            callback(chunkX, chunkZ, seededRandom, dimensionId, callbackSeed, worldSeed, dimensionSeed, chunkSeed);
        });
    },
    __inworld: {
        nativeSetBlock: function(x, y, z, id, data) {
            NativeAPI_setTile(x, y, z, id, data);
        },
        nativeGetBlockID: function(x, y, z) {
            return NativeAPI_getTile(x, y, z);
        },
        nativeGetBlockData: function(x, y, z) {
            return NativeAPI_getData(x, y, z);
        },
        setBlock: NativeAPI_setTile,
        setFullBlock: function(x, y, z, fullTile) {
            NativeAPI_setTile(x, y, z, fullTile.id, fullTile.data);
        },
        getBlock: function(x, y, z) {
            var tile = NativeAPI_getTileAndData(x, y, z);
            return {
                id: ((tile >> 24 == 1) ? -1 : 1) * (tile & 0xFFFF),
                data: ((tile >> 16) & 0xFF)
            };
        },
        getBlockID: NativeAPI_getTile,
        getBlockData: NativeAPI_getData,
        destroyBlock: function(x, y, z, drop, player) {
            var tile = this.getBlock(x, y, z);
            if (drop) {
                BlockRegistry.onBlockDestroyed({
                    x: x,
                    y: y,
                    z: z
                }, tile, false, player || Player.get());
            }
            Level.destroyBlock(x, y, z, drop);
        },
        getLightLevel: requireMethodFromNativeAPI("api.NativeAPI", "getBrightness"),
        isChunkLoaded: function(x, z) {
            return Level.isChunkLoaded(x, z);
        },
        isChunkLoadedAt: function(x, y, z) {
            return Level.isChunkLoadedAt(x, y, z);
        },
        getChunkState: function(x, z) {
            return Level.getChunkState(x, z);
        },
        getChunkStateAt: function(x, y, z) {
            return Level.getChunkStateAt(x, y, z);
        },
        getTileEntity: function(x, y, z, blockSource) {
            return TileEntity.getTileEntity(x, y, z, blockSource);
        },
        addTileEntity: function(x, y, z, blockSource) {
            return TileEntity.addTileEntity(x, y, z, blockSource);
        },
        removeTileEntity: function(x, y, z, blockSource) {
            return TileEntity.destroyTileEntityAtCoords(x, y, z, blockSource);
        },
        getContainer: function(x, y, z, blockSource) {
            var nativeTileEntity = blockSource ? blockSource.getBlockEntity(x, y, z) : Level.getTileEntity(x, y, z);
            if (nativeTileEntity) {
                return nativeTileEntity;
            }
            var id = blockSource ? blockSource.getBlockId(x, y, z) : NativeAPI_getTile(x, y, z);
            if (TileEntity.isTileEntityBlock(id)) {
                var tileEntity = this.getTileEntity(x, y, z, blockSource);
                if (tileEntity && tileEntity.container) {
                    return tileEntity.container;
                }
            }
            return null;
        },
        getWorldTime: function() {
            return Level.getTime();
        },
        setWorldTime: function(time) {
            return Level.setTime(time || 0);
        },
        setDayMode: function(day) {
            this.setNightMode(!day);
        },
        setNightMode: function(night) {
            Level.setNightMode(night);
        },
        getWeather: function() {
            return {
                rain: Level.getRainLevel(),
                thunder: Level.getLightningLevel()
            };
        },
        setWeather: function(weather) {
            if (weather) {
                Level.setRainLevel(weather.rain || 0), Level.setLightningLevel(weather.thunder || 0);
            }
        },
        clip: function(x1, y1, z1, x2, y2, z2, mode) {
            return Level.clip(x1, y1, z1, x2, y2, z2, mode || 0);
        },
        drop: function(x, y, z, id, count, data, extra) {
            return Level.dropItem(x, y, z, 0, id, count, data, extra);
        },
        explode: function(x, y, z, power, someBoolean) {
            explode(x, y, z, power, someBoolean);
        },
        setBiomeMap: function(x, z, biome) {
            Level.setBiomeMap(x, z, biome);
        },
        getBiomeMap: function(x, z) {
            return Level.getBiomeMap(x, z);
        },
        setBiome: function(x, z, biome) {
            Level.getBiome(x, z, biome);
        },
        getBiome: function(x, z) {
            return Level.getBiome(x, z);
        },
        getBiomeName: function(x, z) {
            var biome = Level.getBiome(x, z);
            return Level.biomeIdToName(biome);
        },
        getBiomeNameById: function(biome) {
            return Level.biomeIdToName(biome);
        },
        getTemperature: function(x, y, z) {
            return Level.getTemperature(x, y, z);
        },
        getGrassColor: function(x, z) {
            return Level.getGrassColor(x, z);
        },
        setGrassColor: function(x, z, color) {
            return Level.setGrassColor(x, z, color || 0);
        },
        getGrassColorRGB: function(x, z) {
            var color = Level.getGrassColor(x, z);
            return {
                r: (color >> 16) & 255,
                g: (color >> 8) & 255,
                b: (color >> 0) & 255
            };
        },
        setGrassColorRGB: function(x, z, rgb) {
            var color = parseInt(rgb.r) * 256 * 256 + parseInt(rgb.g) * 256 + parseInt(rgb.b);
            return Level.setGrassColor(x, z, color);
        },
        canSeeSky: function(x, y, z) {
            return GenerationUtils.canSeeSky(x, y, z);
        },
        playSound: function(x, y, z, name, volume, pitch) {
            if (!pitch) {
                pitch = 0.5;
            }
            Level.playSound(x, y, z, name, volume, pitch);
        },
        playSoundAtEntity: function(entity, name, volume, pitch) {
            if (!pitch) {
                pitch = 0.5;
            }
            Level.playSoundEnt(entity, name, volume, pitch);
        },
        getWorldDir: function() {
            return Level.getWorldDir();
        },
        getSeed: function() {
            return Level.getSeed();
        }
    },
    __inmenu: {
        nativeSetBlock: function() {},
        nativeGetBlockID: function() {
            return 0;
        },
        nativeGetBlockData: function(x, y, z) {
            return 0;
        },
        setBlock: function(x, y, z, id, data) {},
        setFullBlock: function(x, y, z, fullTile) {},
        getBlock: function(x, y, z) {
            return {
                id: 0,
                data: 0
            };
        },
        getBlockID: function(x, y, z) {
            return 0;
        },
        getBlockData: function(x, y, z) {
            return 0;
        },
        destroyBlock: function(x, y, z, drop) {},
        getLightLevel: function(x, y, z) {
            return 0;
        },
        isChunkLoaded: function(x, z) {
            return false;
        },
        isChunkLoadedAt: function(x, y, z) {
            return false;
        },
        getTileEntity: function(x, y, z) {
            return null;
        },
        addTileEntity: function(x, y, z) {
            return null;
        },
        removeTileEntity: function(x, y, z) {
            return false;
        },
        getContainer: function(x, y, z) {
            return null;
        },
        getWorldTime: function() {
            return 0;
        },
        setWorldTime: function(time) {},
        setDayMode: function(day) {},
        setNightMode: function(night) {},
        getWeather: function() {
            return {
                rain: 0,
                thunder: 0
            };
        },
        setWeather: function(weather) {},
        drop: function(x, y, z, id, count, data, extra) {
            return null;
        },
        explode: function(x, y, z, power, someBoolean) {},
        getBiome: function(x, z) {
            return -1;
        },
        getBiomeName: function(x, z) {
            return "error: level not loaded";
        },
        getGrassColor: function(x, z) {
            return 0;
        },
        setGrassColor: function(x, z, color) {},
        getGrassColorRGB: function(x, z) {
            var color = Level.getGrassColor(x, z);
            return {
                r: 0,
                g: 0,
                b: 0
            };
        },
        setGrassColorRGB: function(x, z, rgb) {},
        canSeeSky: function(x, y, z) {
            return false;
        },
        playSound: function(x, y, z, name, volume, pitch) {},
        playSoundAtEntity: function(entity, name, volume, pitch) {}
    }
};
WorldAPI.setLoaded(false);
Callback.addCallback("LevelSelected", function() {
    WorldAPI.setLoaded(true);
});
Callback.addCallback("LevelLeft", function() {
    WorldAPI.setLoaded(false);
});
Callback.addCallback("BlockChanged", function(coords, block1, block2, int1, int2, region) {
    WorldAPI.onBlockChanged(coords, block1, block2, region, int1, int2);
});
var AnimatorToken = {
    __current: 1,
    genToken: function() {
        return this.__current++;
    }
};

function AnimationHelper() {
    this.animation = [];
    this.animationDelay = 1;
    this.animationOffsets = {
        0: 0
    };
    this.getOffset = function(token) {
        return this.animationOffsets[token || 0] || 0;
    };
    this.setOffset = function(token, offset) {
        this.animationOffsets[token || 0] = offset;
    };
    this.getGlobalTime = function() {
        return java.lang.System.currentTimeMillis() / 50;
    };
    this.getTime = function(token) {
        return this.getGlobalTime() - this.getOffset(token);
    };
    this.resetAnimation = function(token) {
        this.setOffset(token, this.getGlobalTime());
    };
    this.getFrameNumber = function(token) {
        return parseInt(this.getTime(token) / this.animationDelay) % this.animation.length;
    };
    this.setDelay = function(delay) {
        this.animationDelay = delay || 1;
    };
    this.setAnimation = function(arr) {
        this.animation = arr;
    };
    this.clearAnimation = function() {
        this.animation = [];
    };
    this.addFrame = function(frame) {
        this.animation.push(frame);
    };
    this.getFrame = function(token) {
        return this.animation[this.getFrameNumber(token)];
    };
    this.inherit = function(animator) {
        this.clearAnimation();
        this.setDelay(animator.animationDelay);
        for (var i in animator.animation) {
            this.addFrame(animator.animation[i]);
        }
    };
}

function Texture(path) {
    this.path = path;
    this.isAnimated = false;
    this.animator = new AnimationHelper();
    this.resolution = {
        w: 64,
        h: 32
    };
    this.setTexture = function(path) {
        this.path = path;
        this.isAnimated = false;
        return this;
    };
    this.setResolution = function(w, h) {
        h = h || w;
        this.resolution.w = w;
        this.resolution.h = h;
        return this;
    };
    this.setAnimation = function(animation, delay) {
        this.animator.setDelay(delay);
        this.animator.setAnimation(animation);
        this.isAnimated = true;
        return this;
    };
    this.resetAnimation = function(token) {
        this.animator.resetAnimation(token);
        return this;
    };
    this.getTexture = function(token) {
        if (this.isAnimated) {
            return this.animator.getFrame(token);
        } else {
            return this.path;
        }
    };
    this.getResolution = function() {
        return {
            w: this.resolution.w * this.pixelScale,
            h: this.resolution.h * this.pixelScale
        };
    };
    this.pixelScale = 1;
    this.setPixelScale = function(scale) {
        this.pixelScale = scale;
        return this;
    };
}
var ce_default_entity_texture = new Texture("images/mob/ce_default_entity_texture.png").setPixelScale(8);
var ce_missing_entity_texture = new Texture("images/mob/ce_missing_entity_texture.png").setPixelScale(1);
var EntityRenderGlobalCache = {
    globalCache: {},
    saveRenderAPI: function(api, name, isLocal) {
        var cache;
        if (isLocal) {
            cache = api.localCache;
        } else {
            cache = this.globalCache;
        }
        cache[name] = api.toCache();
    },
    loadRenderAPI: function(api, name, isLocal) {
        var cache;
        if (isLocal) {
            cache = api.localCache;
        } else {
            cache = this.globalCache;
        }
        if (cache[name]) {
            api.fromCache(cache[name]);
            return true;
        }
        return false;
    }
};

function RenderAPI(params) {
    this.getID = this.getId = this.getRenderType = function() {
        return parseInt(this.renderId);
    };
    this.init = function(params) {
        this.isEmpty = true;
        this.isChangeable = true;
        this.renderer = null;
        this.model = null;
        this.parts = {};
        this.renderId = -1;
        if (!params) {
            params = {};
        }
        if (typeof(params) == "number") {
            this.isChangeable = false;
            this.renderId = params;
            return;
        }
        if (typeof(params) == "string") {
            this.loadInitialState(params);
            return;
        }
        if (typeof(params) != "object") {
            this.isChangeable = false;
            return;
        }
        if (typeof(params.name) == "string") {
            this.loadInitialState(params.name);
            return;
        }
        if (parseInt(params.item)) {
            this.isChangeable = false;
            this.renderer = Renderer.createItemSpriteRenderer(parseInt(params.item));
        } else {
            var skin = params.skin || "textures/logo.png";
            var scale = params.scale || 1;
            this.isEmpty = !params.raw;
            this.isChangeable = true;
            this.renderer = Renderer.createRendererWithSkin(skin, scale);
            this.renderId = this.renderer.getRenderType();
            this.initModel();
        }
    };
    this.initModel = function() {
        this.model = this.renderer.getModel();
        if (this.isEmpty) {
            this.getPart("head").clear();
            this.getPart("body").clear();
            this.getPart("leftArm").clear();
            this.getPart("rightArm").clear();
            this.getPart("leftLeg").clear();
            this.getPart("rightLeg").clear();
        } else {
            this.getPart("head");
            this.getPart("body");
            this.getPart("leftArm");
            this.getPart("rightArm");
            this.getPart("leftLeg");
            this.getPart("rightLeg");
        }
        this.getPart("headwear").clear(); // backcomp
    };
    this.checkChangeable = function() {
        if (!this.isChangeable) {
            MCSystem.throwException("cannot modify render with id " + this.renderId + " it is not changeable (it is native mob renderer, item sprite or render failed to create).");
        }
    };
    this.rebuild = function() {
        this.model.reset();
    }
    this.getModel = function() {
        this.checkChangeable();
        return this.model;
    };
    this.transform = function() {
        return this.renderer.transform;
    }
    this.getPart = function(name) {
        this.checkChangeable();
        var part = this.parts[name];
        if (!part && this.model) {
            part = this.model.getPart(name);
            if (part) {
                this.parts[name] = part;
            }
        }
        return part;
    };
    this.addPart = function(name, params) {
        var dot = name.lastIndexOf(".");
        if (dot == -1) {
            MCSystem.throwException("addPart got invalid part name, it must be formatted as parentPartName.newPartName");
        }
        var parentName = name.substring(0, dot);
        var parentPart = this.getPart(parentName);
        if (!parentPart) {
            MCSystem.throwException("addPart got invalid parent part name " + parentName + ", such part does not exist (full name given is " + name + ")");
        }
        var part = parentPart.addPart(name);
        this.parts[name] = part;
        if (params) {
            this.setPartParams(name, params);
        }
        return part;
    };
    this.setPartParams = function(name, params) {
        var part = this.getPart(name);
        if (!part) {
            MCSystem.throwException("setPart got invalid part name " + name);
        }
        part.setTextureSize(params.width || 64, params.height || 32);
        part.setTextureOffset(params.u || 0, params.v || 0);
        if (params.pos) {
            part.setOffset(params.pos.x || params.pos[0] || 0, params.pos.y || params.pos[1] || 0, params.pos.z || params.pos[2] || 0);
        }
        if (params.rotation) {
            part.setRotation(params.rotation.x || params.rotation[0] || 0, params.rotation.y || params.rotation[1] || 0, params.rotation.z || params.rotation[2] || 0);
        }
    };
    this.setPart = function(name, data, params) {
        var part = this.getPart(name);
        if (!part) {
            MCSystem.throwException("setPart got invalid part name " + name);
        }
        if (params) {
            if (!params.add) {
                part.clear();
            }
            this.setPartParams(name, params);
        }
        this._setPartRecursive(part, data, {
            x: 0,
            y: 0,
            z: 0
        });
        this.model.reset();
    };
    this._setPartRecursive = function(part, data, coords) {
        for (var i in data) {
            var element = data[i];
            if (!element.coords) {
                print("RenderAPI Error: some element in part " + part + " has no coords, aborting...");
                Logger.Log("RenderAPI Error: some element in part " + part + " has no coords, aborting...", "ERROR");
                continue;
            }
            var elementCoords = {
                x: parseFloat(element.coords.x) + parseFloat(coords.x),
                y: parseFloat(element.coords.y) + parseFloat(coords.y),
                z: parseFloat(element.coords.z) + parseFloat(coords.z)
            };
            if (element.uv) {
                part.setTextureOffset(element.uv.x, element.uv.y);
            }
            if (element.size) {
                element.size.w = element.size.w || 0;
                part.addBox(elementCoords.x - element.size.x * 0.5, elementCoords.y - element.size.y * 0.5, elementCoords.z - element.size.z * 0.5, element.size.x, element.size.y, element.size.z, element.size.w);
            }
            if (element.children) {
                this._setPartRecursive(part, element.children, elementCoords);
            }
        }
    };
    this.localCache = {};
    this.fromCache = function(data) {
        this.renderer = data.renderer;
        this.renderId = data.renderId;
        this.model = data.model;
        this.isChangeable = data.isChangeable;
        this.parts = data.parts;
    };
    this.toCache = function() {
        return {
            renderer: this.renderer,
            renderId: this.renderId,
            model: this.model,
            parts: this.parts,
            isChangeable: this.isChangeable
        };
    };
    this.saveState = function(name, isLocal) {
        EntityRenderGlobalCache.saveRenderAPI(this, name, isLocal);
    };
    this.loadState = function(name, isLocal) {
        return EntityRenderGlobalCache.loadRenderAPI(this, name, isLocal);
    };
    this.loadInitialState = function(name) {
        if (!this.loadState(name)) {
            MCSystem.throwException("cannot create Render object from saved state " + name + ", it does not exist");
        }
    };
    this.saveToNext = function(name, isLocal) {
        this.saveState(name);
        this.init(params);
    };
    this.init(params);
    this.setTextureResolution = function() {
        logDeprecation("RenderAPI.setTextureResolution()");
    };

    this.transform = function() {
        if (!this.renderer) {
            MCSystem.throwException("cannot apply transformations for native renders or renders that weren't created properly");
        }

        return this.renderer.transform;
    }
}
var BASIC_NULL_RENDER = new RenderAPI();
var ce_default_entity_render = new RenderAPI();
ce_default_entity_render.setPart("body", [{
    type: "box",
    coords: {
        x: 0,
        y: 16,
        z: 0
    },
    uv: {
        x: 0,
        y: 0
    },
    size: {
        x: 16,
        y: 16,
        z: 16
    }
}], {});

function ModelAPI(parentModel) {
    this.applyTextureResolution = function() {
        var resolution = this.getTextureResolution();
        if (this.render) {
            this.render.setTextureResolution(resolution.w, resolution.h);
        }
        for (var i in this.animator.animation) {
            this.animator.animation[i].setTextureResolution(resolution.w, resolution.h);
        }
        return this;
    };
    this.setTexture = function(textureObj) {
        this.texture = textureObj || ce_missing_entity_texture;
        this.applyTextureResolution();
        return this;
    };
    this.getTextureObj = function() {
        return this.texture;
    };
    this.getTexture = function() {
        return this.texture.getTexture();
    };
    this.getTextureResolution = function() {
        return this.texture.getResolution();
    };
    this.isAnimated = false;
    this.animator = new AnimationHelper();
    this.setRender = function(render) {
        this.isAnimated = false;
        this.render = render || ce_default_entity_render;
        this.applyTextureResolution();
        return this;
    };
    this.createAnimation = function(ticks, func, delay) {
        this.animator.clearAnimation();
        this.animator.setDelay(delay);
        var last = this.render;
        for (var tick = 0; tick < ticks; tick++) {
            var render = func(tick, this);
            if (render) {
                this.animator.addFrame(render);
                last = render;
            } else {
                this.animator.addFrame(last);
            }
        }
        this.isAnimated = true;
        this.applyTextureResolution();
        return this;
    };
    this.resetAnimation = function(token) {
        this.texture.resetAnimation(token);
        this.animator.resetAnimation(token);
    };
    this.getTextureAndRender = function(token) {
        var texture = this.texture.getTexture(token);
        var render;
        if (this.isAnimated) {
            render = this.animator.getFrame(token);
        } else {
            render = this.render;
        }
        return {
            texture: texture,
            render: render.getID()
        };
    };
    if (parentModel) {
        this.setTexture(parentModel.texture);
        this.setRender(parentModel.render);
        this.animator.inherit(parentModel.animator);
        this.isAnimated = parentModel.isAnimated;
    } else {
        this.setTexture(null);
        this.setRender(null);
    }
}
var ce_default_entity_model = new ModelAPI().setTexture(ce_default_entity_texture);
var ce_empty_entity_model = new ModelAPI().setRender(BASIC_NULL_RENDER);
var ce_missing_entity_model = new ModelAPI();

function ModelWatcher(entity, model) {
    this._texture = null;
    this._render = null;
    this.model = model;
    this.entity = entity;
    this.token = AnimatorToken.genToken();
    this.update = function() {
        var current = this.model.getTextureAndRender(this.token);
        if (current.texture != this._texture) {
            this._texture = current.texture;
            EntityAPI.setSkin(this.entity, this._texture);
        }
        if (current.render != this._render) {
            this._render = current.render;
            EntityAPI.setRender(this.entity, this._render);
        }
    };
    this.resetAnimation = function() {
        this.model.resetAnimation(this.token);
    };
    this.destroy = function() {
        this.remove = true;
    };
}

function EntityAI(customPrototype) {
    this.getDefaultPriority = function() {
        return 1;
    };
    this.getDefaultName = function() {
        return "basic-entity-ai";
    };
    this.params = {};
    this.setParams = function(params) {
        for (var name in params) {
            this.params[name] = params[name];
        }
    };
    this.executionStarted = function() {};
    this.executionEnded = function() {};
    this.executionPaused = function() {};
    this.executionResumed = function() {};
    this.execute = function() {};
    this.__execute = function() {
        if (this.data.executionTimer > 0) {
            this.data.executionTimer--;
            if (this.data.executionTimer == 0) {
                this.finishExecution();
                return;
            }
        }
        this.execute();
    };
    this.setExecutionTimer = function(timer) {
        this.data.executionTimer = timer;
    };
    this.removeExecutionTimer = function() {
        this.data.executionTimer = -1;
    };
    this.data = {
        executionTimer: -1
    };
    this.isInstance = false;
    this.parent = null;
    this.entity = null;
    this.instantiate = function(parent, name) {
        var instance = ModAPI.cloneObject(this, true);
        instance.parent = parent;
        instance.entity = parent.entity;
        instance.controller = parent.AI;
        instance.isInstance = true;
        instance.executionName = name;
        return instance;
    };
    this.aiEntityChanged = function(entity) {
        this.entity = entity;
    };
    this.finishExecution = function() {
        if (this.controller) {
            this.controller.disableAI(this.executionName);
        }
    };
    this.changeSelfPriority = function(priority) {
        if (this.controller) {
            this.controller.setPriority(this.executionName, priority);
        }
    };
    this.enableAI = function(name, priority, extra) {
        if (this.controller) {
            this.controller.setPriority(name, priority, extra);
        }
    };
    this.disableAI = function(name) {
        if (this.controller) {
            this.controller.setPriority(name);
        }
    };
    this.setPriority = function(name, priority) {
        if (this.controller) {
            this.controller.setPriority(name, priority);
        }
    };
    this.getAI = function(name) {
        if (this.controller) {
            return this.controller.getAI(name);
        }
    };
    this.getPriority = function(name) {
        if (this.controller) {
            return this.controller.getPriority(name);
        }
    };
    this.attackedBy = function(entity) {};
    this.hurtBy = function(entity) {};
    this.projectileHit = function(projectile) {};
    this.death = function(entity) {};
    for (var name in customPrototype) {
        this[name] = customPrototype[name];
    }
}
var EntityAIIdle = new EntityAI({
    getDefaultPrioriy: function() {
        return 1;
    },
    getDefaultName: function() {
        return "idle";
    }
});

function __normalizeAngle(x) {
    while (x > Math.PI * 2) {
        x -= Math.PI * 2;
    }
    while (x < 0) {
        x += Math.PI * 2;
    }
    return x;
}

function __targetValue(x, val, speed) {
    return x + Math.min(Math.max(-speed, val - x), speed);
}

function __targetAngle(angle, target, speed) {
    angle = __normalizeAngle(angle);
    target = __normalizeAngle(target);
    if (target - Math.PI > angle) {
        target -= Math.PI * 2;
    }
    if (angle - Math.PI > target) {
        target += Math.PI * 2;
    }
    return __targetValue(angle, target, speed);
}
var EntityAIFollow = new EntityAI({
    data: {
        target: null,
        targetEntity: null,
        movingYaw: 0
    },
    params: {
        speed: 0.2,
        jumpVel: 0.45,
        rotateSpeed: 0.4,
        rotateRatio: 0.5,
        rotateHead: true,
        denyY: true
    },
    setParams: function(params) {
        for (var name in params) {
            this.params[name] = params[name];
        }
    },
    execute: function() {
        if (this.data.targetEntity) {
            this.data.target = EntityAPI.getPosition(this.data.targetEntity);
        }
        if (this.data.target) {
            var movingVec = EntityAPI.getMovingVector(this.entity);
            var movingAngle = EntityAPI.getMovingAngle(this.entity).yaw;
            var targetAngle = EntityAPI.getLookAt(this.entity, this.data.target.x, this.data.target.y, this.data.target.z).yaw;
            var deltaAngle = movingAngle - targetAngle;
            if (!this.data.movingYaw) {
                this.data.movingYaw = targetAngle;
            }
            if (movingVec.xzsize < this.params.speed * 0.5) {
                this.data.movingYaw = __targetAngle(this.data.movingYaw, targetAngle + deltaAngle * 1.2, this.params.rotateSpeed);
            }
            this.data.movingYaw = __targetAngle(this.data.movingYaw, targetAngle, this.params.rotateSpeed * this.params.rotateRatio);
            EntityAPI.moveToAngle(this.entity, {
                yaw: this.data.movingYaw,
                pitch: 0
            }, this.params);
            if (this.params.rotateHead) {
                EntityAPI.setLookAngle(this.entity, this.data.movingYaw, targetAngle.pitch);
            }
        }
    }
});
var EntityAIPanic = new EntityAI({
    getDefaultPriority: function() {
        return 3;
    },
    getDefaultName: function() {
        return "panic";
    },
    params: {
        speed: 0.22,
        angular_speed: 0.5
    },
    data: {
        yaw: 0,
        add: 0
    },
    setParams: function(params) {
        for (var name in params) {
            this.params[name] = params[name];
        }
    },
    randomize: function() {
        if (Math.random() < 0.5) {
            this.data.add = (Math.random() * -0.5) * this.params.angular_speed;
        } else {
            this.data.add = 0;
        }
    },
    executionStarted: function() {
        this.data.yaw = Math.random() * Math.PI * 2;
        this.randomize();
    },
    execute: function() {
        if (WorldAPI.getThreadTime() % 30 == 0) {
            this.randomize();
            EntityAPI.setLookAngle(this.entity, this.data.yaw, 0);
        }
        this.data.yaw += this.data.add;
        EntityAPI.moveToLook(this.entity, {
            speed: this.params.speed,
            denyY: true,
            jumpVel: 0.45
        });
    }
});
var EntityAIWander = new EntityAI({
    getDefaultPriority: function() {
        return 2;
    },
    getDefaultName: function() {
        return "wander";
    },
    params: {
        speed: 0.08,
        angular_speed: 0.1,
        delay_weight: 0.3
    },
    data: {
        yaw: 0,
        add: 0,
        delay: false,
        _delay: true
    },
    setParams: function(params) {
        for (var name in params) {
            this.params[name] = params[name];
        }
    },
    randomize: function() {
        if (Math.random() < this.params.delay_weight) {
            this.data.delay = true;
        } else {
            this.data.delay = false;
            if (Math.random() < 0.5) {
                this.data.add = (Math.random() * -0.5) * this.params.angular_speed;
            } else {
                this.data.add = 0;
            }
        }
    },
    executionStarted: function() {
        this.data.yaw = Math.random() * Math.PI * 2;
        this.randomize();
    },
    execute: function() {
        if (WorldAPI.getThreadTime() % 30 == 0) {
            this.randomize();
            EntityAPI.setLookAngle(this.entity, this.data.yaw, 0);
        }
        if (!this.data.delay) {
            this.data.yaw += this.data.add;
            EntityAPI.moveToLook(this.entity, {
                speed: this.params.speed,
                denyY: true,
                jumpVel: this.data._delay ? 0 : 0.45
            });
        }
        this.data._delay = this.data.delay;
    }
});
var EntityAIAttack = new EntityAI({
    params: {
        attack_damage: 5,
        attack_range: 2.5,
        attack_rate: 12
    },
    data: {
        timer: 0,
        target: null
    },
    execute: function() {
        if (this.data.target) {
            if (EntityAPI.getDistanceToEntity(this.entity, this.data.target) < this.params.attack_range) {
                if (this.data.timer-- < 0) {
                    this.data.timer = this.params.attack_rate;
                    EntityAPI.damageEntity(this.data.target, this.params.attack_damage);
                }
            } else {
                this.data.timer = 0;
            }
        }
    }
});
var EntityAISwim = new EntityAI({
    getDefaultPriority: function() {
        return -1;
    },
    getDefaultName: function() {
        return "swim";
    },
    params: {
        velocity: 0.2
    },
    inWater: false,
    execute: function() {
        if (WorldAPI.getThreadTime() % 5 == 0) {
            var position = EntityAPI.getPosition(this.entity);
            var tile = WorldAPI.getBlockID(position.x, position.y + 0.4, position.z);
            this.inWater = (tile > 7 && tile < 12);
        }
        if (this.inWater) {
            var velocity = EntityAPI.getVelocity(this.entity);
            EntityAPI.setVelocity(this.entity, velocity.x, this.params.velocity, velocity.z);
        }
    }
});

function EntityAIWatcher(customPrototype) {
    this.parent = EntityAI;
    this.parent(customPrototype);
    this.getDefaultPriority = function() {
        return -1;
    };
    this.__execute = function() {
        this.execute();
    };
}
var EntityAIPanicWatcher = new EntityAIWatcher({
    params: {
        panic_time: 200,
        priority_panic: 5,
        priority_default: 1,
        name: "panic"
    },
    data: {
        timer: -1
    },
    hurtBy: function() {
        this.setPriority(this.params.name, this.params.priority_panic);
        this.data.timer = this.params.panic_time;
    },
    executionStarted: function() {
        this.setPriority(this.params.name, this.params.priority_default);
    },
    execute: function() {
        if (this.data.timer >= 0) {
            if (--this.data.timer == 0) {
                this.setPriority(this.params.name, this.params.priority_default);
            }
        }
    }
});
var EntityAIController = {
    currentPriority: 0,
    loadedAI: {},
    loadedData: {},
    isAILoaded: false,
    getAITypes: function() {
        return {
            "main": {
                type: EntityAIIdle
            }
        };
    },
    loadEntityAI: function() {
        var types = this.getAITypes();
        this.loadedAI = {};
        for (var name in types) {
            var data = types[name];
            var AI = data.type.instantiate(this.parent, name);
            AI.setParams(data);
            var enabled = data.enable + "" == "undefined" ? true : data.enable;
            this.loadedAI[name] = {
                AI: AI,
                priority: data.priority || AI.getDefaultPriority(),
                enabled: enabled
            };
            if (enabled) {
                AI.executionStarted();
            }
        }
        for (var name in this.loadedData) {
            var data = this.loadedData[name];
            var ai = this.loadedAI[name];
            if (ai) {
                ai.priority = data.p;
                ai.enabled = data.e;
                ai.data = data.d || {};
            }
        }
        this.refreshPriorities();
    },
    loaded: function() {
        if (!this.isAILoaded) {
            this.loadEntityAI();
            this.aiLoaded();
            this.isAILoaded = true;
        } else {
            this.callAIevent("executionResumed");
        }
    },
    nativeEntityChanged: function() {
        this.callAIevent("aiEntityChanged", this.parent.entity);
    },
    unloaded: function() {
        this.callAIevent("executionPaused");
    },
    aiLoaded: function() {},
    getAI: function(name) {
        return this.loadedAI[name].AI;
    },
    getPriority: function(name) {
        return this.loadedAI[name].priority;
    },
    enableAI: function(name, priority, extra) {
        var data = this.loadedAI[name];
        if (data) {
            if (!data.enabled) {
                data.enabled = true;
                data.AI.executionStarted(extra);
            }
            this.setPriority(name, priority + "" == "undefined" ? data.priority : priority);
        }
    },
    disableAI: function(name) {
        var data = this.loadedAI[name];
        if (data && data.enabled) {
            data.enabled = false;
            data.AI.executionEnded();
            this.refreshPriorities();
        }
    },
    setPriority: function(name, priority) {
        var data = this.loadedAI[name];
        if (data && data.priority != priority) {
            var isActive = data.priority == this.currentPriority;
            data.priority = priority;
            this.refreshPriorities();
            if (isActive && data.priority != this.currentPriority) {
                data.AI.executionPaused();
            }
        }
    },
    refreshPriorities: function() {
        var maxPriority = -1;
        for (var name in this.loadedAI) {
            var data = this.loadedAI[name];
            if (data.enabled && maxPriority < data.priority) {
                maxPriority = data.priority;
            }
        }
        if (maxPriority != this.currentPriority) {
            for (var name in this.loadedAI) {
                var data = this.loadedAI[name];
                if (data.enabled) {
                    if (data.priority == maxPriority) {
                        data.AI.executionResumed();
                    }
                    if (data.priority == this.currentPriority) {
                        data.AI.executionPaused();
                    }
                }
            }
        }
        this.currentPriority = maxPriority;
    },
    callAIevent: function(eventName, parameter, extra) {
        for (var name in this.loadedAI) {
            var data = this.loadedAI[name];
            if (data.enabled) {
                data.AI[eventName](parameter, extra);
            }
        }
    },
    update: function() {
        for (var name in this.loadedAI) {
            var data = this.loadedAI[name];
            if (data.enabled && (data.priority == this.currentPriority || data.priority == -1)) {
                data.AI.__execute();
            }
        }
        this.tick();
    },
    tick: function() {},
    attackedBy: function(attacker) {
        this.callAIevent("attackedBy", attacker);
    },
    hurtBy: function(attacker, damage) {
        this.callAIevent("hurtBy", attacker, damage);
    },
    death: function(attacker) {
        this.callAIevent("death", attacker);
    },
    projectileHit: function(projectile) {
        this.callAIevent("projectileHit", projectile);
    },
    save: function() {
        var data = {};
        for (var name in this.loadedAI) {
            var ai = this.loadedAI[name];
            data[name] = {
                e: ai.enabled,
                p: ai.priority,
                d: ai.AI.data
            };
        }
        return data;
    },
    read: function(data) {
        this.loadedData = data;
    }
};
var EntityDescriptionController = {
    isDynamic: false,
    getHitbox: function() {
        return {
            w: 0.99,
            h: 0.99
        };
    },
    getHealth: function() {
        return 20;
    },
    getNameTag: function() {
        return null;
    },
    getDrop: function(attacker) {
        return [];
    },
    created: function() {
        var health = this.getHealth();
        Entity.setMaxHealth(this.entity, health);
        Entity.setHealth(this.entity, health);
    },
    loaded: function() {
        var health = this.getHealth();
        Entity.setMaxHealth(this.entity, health);
        var hitbox = this.getHitbox();
        Entity.setCollisionSize(this.entity, hitbox.w || 0, hitbox.h || 0);
        var nametag = this.getNameTag();
        if (nametag) {
            Entity.setNameTag(this.entity, nametag);
        } else {
            Entity.setNameTag(this.entity, "");
        }
    },
    unloaded: function() {},
    removed: function() {},
    getNumberFromData: function(data, defValue) {
        if (!data) {
            return defValue;
        }
        if (typeof(data) == "number") {
            return data;
        } else {
            if (data.min && data.max) {
                return parseInt((data.max - data.min + 1) * Math.random()) + data.min;
            } else {
                if (data.length) {
                    return data[parseInt(data.length * Math.random())];
                } else {
                    return defValue;
                }
            }
        }
    },
    provideDrop: function(attacker) {
        var drop = this.getDrop(attacker);
        var pos = EntityAPI.getPosition(this.entity);
        var dropItem = function(id, count, data, extra) {
            EntityAPI.setVelocity(Level.dropItem(pos.x, pos.y + 0.3, pos.z, 0, id, count, data, extra), Math.random() * 0.4 - 0.2, Math.random() * 0.3, Math.random() * 0.4 - 0.2);
        };
        for (var i in drop) {
            var item = drop[i];
            var chance = item.chance || 1;
            if (item.id && Math.random() < chance) {
                var count = this.getNumberFromData(item.count, 1);
                var data = this.getNumberFromData(item.data, 0);
                if (item.separate) {
                    for (var j = 0; j < count; j++) {
                        dropItem(item.id, 1, data);
                    }
                } else {
                    dropItem(item.id, count, data, item.extra);
                }
            }
        }
    },
    death: function(attacker) {
        this.provideDrop(attacker);
    },
    update: function() {},
    save: function() {},
    read: function() {}
};
var EntityVisualController = {
    modelWatchers: {},
    modelWatcherStack: [],
    getModels: function() {
        return {
            "main": ce_default_entity_model
        };
    },
    createModelWatchers: function() {
        this.modelWatchers = {};
        var models = this.getModels();
        if (!models.main) {
            models.main = ce_default_entity_model;
        }
        for (var name in models) {
            this.modelWatchers[name] = new ModelWatcher(this.entity, models[name]);
        }
    },
    getModelWatcher: function(name) {
        return this.modelWatchers[name];
    },
    setModel: function(name, ticks) {
        var watcher = this.getModelWatcher(name);
        if (!watcher) {
            Logger.Log("cannot set entity model: no model watcher for '" + name + "' found.", "ERROR");
            return;
        }
        if (!this.modelWatcherStack) {
            this.modelWatcherStack = [];
        }
        if (ticks >= 0) {
            this.modelWatcherStack.unshift({
                name: name,
                ticks: ticks
            });
        } else {
            this.modelWatcherStack = [{
                name: name,
                ticks: -1
            }];
        }
        watcher.resetAnimation();
    },
    resetModel: function() {
        this.modelWatcherStack = [];
    },
    resetAllAnimations: function() {
        for (var name in this.modelWatchers) {
            this.modelWatchers[name].resetAnimation();
        }
    },
    getCurrentModelName: function() {
        var current = this.modelWatcherStack[0];
        while (current && current.ticks == 0) {
            current = this.modelWatcherStack.shift();
        }
        if (!current) {
            return {
                name: "main",
                ticks: -1
            };
        } else {
            return current;
        }
    },
    loaded: function() {
        this.createModelWatchers();
    },
    update: function() {
        var current = this.getCurrentModelName();
        var watcher = this.getModelWatcher(current.name);
        if (watcher) {
            watcher.update();
        }
        current.ticks--;
    },
    save: function() {
        return this.modelWatcherStack;
    },
    read: function(data) {
        this.modelWatcherStack = data || [];
    }
};
var EntityEventController = {
    update: function() {
        this.tick();
    },
    tick: function() {},
    removed: function() {},
    created: function(extra) {},
    loaded: function() {},
    unloaded: function() {},
    attackedBy: function(attacker) {},
    hurtBy: function(attacker, damage) {},
    death: function(attacker) {},
    projectileHit: function(projectile) {},
    save: function() {},
    read: function() {}
};
var CustomEntityConfig = {
    unloaded_despawn_time_in_secs: 600,
    despawn_unloaded_entities: true
};
var ENTITY_UNLOAD_DISTANCE = 56;

function CustomEntity(nameId) {
    this.nameId = nameId;
    this.controllers = {};
    this.isInstance = false;
    this.entity = null;
    this.age = 0;
    this.unloadedTime = 0;
    this.realPosition = null;
    this.__base_type = 28;
    var self = this;
    this.saverId = Saver.registerObjectSaver(this.nameId, {
        read: function(obj) {
            self.read(obj);
            return null;
        },
        save: function(obj) {
            return obj.save();
        }
    });
    this.addController = function(name, basicPrototype) {
        var controller = ModAPI.cloneObject(basicPrototype, true);
        controller.parent = null;
        controller.__controller_name = name;
        this[name] = controller;
        this.controllers[name] = controller;
        return this;
    };
    this.customizeController = function(name, customPrototype) {
        if (!this[name]) {
            Logger.Log("Cannot customize entity controller " + name + ": no such defined", "ERROR");
            return;
        }
        var customController = ModAPI.cloneObject(customPrototype, true);
        var baseController = this[name];
        for (var name in customController) {
            baseController[name] = customController[name];
        }
    };
    this.customizeEvents = function(custom) {
        this.customizeController("event", custom);
    };
    this.customizeDescription = function(custom) {
        this.customizeController("description", custom);
    };
    this.customizeVisual = function(custom) {
        this.customizeController("visual", custom);
    };
    this.customizeAI = function(custom) {
        this.customizeController("AI", custom);
    };
    this.setBaseType = function(type) {
        if (this.isInstance) {
            Logger.Log("cannot set base entity type on entity in world", "ERROR");
            return;
        }
        this.__base_type = type;
    };
    this.callControllerEvent = function() {
        var event = arguments[0];
        var params = [];
        for (var i in arguments) {
            if (i > 0) {
                params.push(arguments[i]);
            }
        }
        for (var name in this.controllers) {
            var controller = this.controllers[name];
            if (controller[event]) {
                controller[event].apply(controller, params);
            }
        }
    };
    this.setNativeEntity = function(entity) {
        this.entity = parseInt(entity);
        for (var name in this.controllers) {
            var controller = this.controllers[name];
            controller.entity = parseInt(entity);
        }
        this.callControllerEvent("nativeEntityChanged");
    };
    this.recreateEntity = function() {
        if (this.realPosition) {
            this.lockRemovalHook = true;
            Entity.remove(this.entity);
            this.lockRemovalHook = false;
            this.setNativeEntity(Level.spawnMob(this.realPosition.x, this.realPosition.y, this.realPosition.z, this.__base_type));
            if (!this.isLoaded) {
                this.isLoaded = true;
                this.callControllerEvent("loaded");
            }
        }
    };
    this.getPlayerDistance = function() {
        var dx = getPlayerX() - this.realPosition.x;
        var dz = getPlayerZ() - this.realPosition.z;
        return Math.sqrt(dx * dx + dz * dz);
    };
    this.denyDespawn = function() {
        this.isNaturalDespawnAllowed = false;
        this.isDespawnDenied = true;
    };
    this.allowNaturalDespawn = function() {
        this.isNaturalDespawnAllowed = true;
        this.isDespawnDenied = false;
    };
    this.handleUnloadedState = function() {
        this.unloadedTime++;
        if (this.age % 200 == 0) {
            if (!this.isDespawnDenied && CustomEntityConfig.despawn_unloaded_entities && this.unloadedTime > CustomEntityConfig.unloaded_despawn_time_in_secs) {
                this.destroy();
            } else {
                if (this.getPlayerDistance() < ENTITY_UNLOAD_DISTANCE) {
                    if (!this.isNaturalDespawnAllowed) {
                        if (!this.isDestroyed) {
                            this.recreateEntity();
                        }
                    } else {
                        this.destroy();
                    }
                }
            }
        }
    };
    this.update = function() {
        if (this.age % 20 == 0) {
            var position = EntityAPI.getPosition(this.entity);
            var isLoaded = position.y > 0;
            if (isLoaded) {
                this.realPosition = position;
            }
            if (this.isLoaded && !isLoaded) {
                this.callControllerEvent("unloaded");
            }
            if (!this.isLoaded && isLoaded) {
                this.callControllerEvent("loaded");
            }
            this.isLoaded = isLoaded;
            if (isLoaded) {
                this.unloadedTime = 0;
            } else {
                this.handleUnloadedState();
            }
        }
        if (this.isLoaded) {
            for (var name in this.controllers) {
                this.controllers[name].update();
            }
        }
        this.age++;
    };
    this.instantiate = function(entity) {
        entity = parseInt(entity);
        var instance = ModAPI.cloneObject(this, true);
        instance.entity = entity;
        instance.realPosition = EntityAPI.getPosition(entity);
        instance.isInstance = true;
        instance.isLoaded = false;
        for (var name in instance.controllers) {
            var controller = instance.controllers[name];
            controller.parent = instance;
            controller.entity = entity;
            instance[name] = controller;
        }
        Saver.registerObject(instance, this.saverId);
        MobRegistry.registerUpdatableAsEntity(instance);
        Updatable.addUpdatable(instance);
        return instance;
    };
    this.lockRemovalHook = false;
    this.registerRemoval = function() {
        if (this.lockRemovalHook) {
            return;
        }
        this.isLoaded = false;
        if (EntityAPI.getXZPlayerDis(this.entity) > ENTITY_UNLOAD_DISTANCE) {
            this.callControllerEvent("unloaded");
        } else {
            this.destroy();
        }
    };
    this.destroy = function() {
        this.remove = this.isDestroyed = true;
        this.callControllerEvent("removed");
        Entity.remove(this.entity);
        this.callControllerEvent("unloaded");
    };
    this.read = function(data) {
        var instance;
        if (this.isInstance) {
            instance = this;
        } else {
            instance = this.instantiate(data.entity);
        }
        instance.entity = data.entity || null;
        instance.age = data.age || 0;
        instance.unloadedTime = data.unloaded || 0;
        instance.realPosition = data.rp || null;
        for (var name in data.controllers) {
            var controller = instance[name];
            if (controller) {
                controller.read(data.controllers[name]);
                controller.entity = instance.entity;
            } else {
                Logger.Log("Entity controller is missing " + name + " while reading entity data", "WARNING");
            }
        }
    };
    this.save = function() {
        var data = {
            entity: parseInt(this.entity),
            age: this.age,
            oneAndHalf: 1.5,
            unloaded: this.unloadedTime,
            controllers: {},
            rp: this.realPosition
        };
        for (var name in this.controllers) {
            data.controllers[name] = this.controllers[name].save(name);
        }
        return data;
    };
}
Callback.addCallback("CoreConfigured", function(config) {
    //CustomEntityConfig = config.access("perfomance.entity");
});
var MobRegistry = {
    customEntities: {},
    loadedEntities: [],
    registerEntity: function(name) {
        var customEntityType = new CustomEntity(name);
        customEntityType.addController("event", EntityEventController);
        customEntityType.addController("description", EntityDescriptionController);
        customEntityType.addController("visual", EntityVisualController);
        customEntityType.addController("AI", EntityAIController);
        this.customEntities[name] = customEntityType;
        return customEntityType;
    },
    registerUpdatableAsEntity: function(updatable) {
        for (var i in this.loadedEntities) {
            if (this.loadedEntities[i].entity == updatable.entity) {
                Logger.Log("Dublicate entities updatables loaded for " + updatable.entity + ", removing second one", "WARNING");
                updatable.remove = true;
                return;
            }
        }
        this.loadedEntities.push(updatable);
    },
    spawnEntityAsPrototype: function(typeName, coords, extraData) {
        var customEntityType = this.customEntities[typeName];
        if (!customEntityType) {
            Logger.Log("Cannot spawn custom entity: type " + typeName + "is not found", "ERROR");
        }
        var entity = Level.spawnMob(coords.x, coords.y, coords.z, customEntityType.__base_type);
        var customEntity = customEntityType.instantiate(entity);
        customEntity.callControllerEvent("created", extraData);
        customEntity.update();
        return customEntity;
    },
    getEntityUpdatable: function(entity) {
        entity = parseInt(entity);
        for (var i in this.loadedEntities) {
            if (this.loadedEntities[i].entity == entity) {
                return this.loadedEntities[i];
            }
        }
        return null;
    },
    registerNativeEntity: function(entity) {},
    registerEntityRemove: function(entity) {
        var updatable = this.getEntityUpdatable(entity);
        if (updatable) {
            updatable.registerRemoval();
        }
    },
    resetEngine: function() {
        this.loadedEntities = [];
    }
};
Callback.addCallback("LevelSelected", function() {
    MobRegistry.resetEngine();
});
Callback.addCallback("EntityAdded", function(entity) {
    MobRegistry.registerNativeEntity(entity);
});
Callback.addCallback("EntityRemoved", function(entity) {
    MobRegistry.registerEntityRemove(entity);
});
Callback.addCallback("PlayerAttack", function(attacker, victim) {
    var updatable = MobRegistry.getEntityUpdatable(victim);
    if (updatable) {
        updatable.callControllerEvent("attackedBy", attacker);
    }
});
Callback.addCallback("EntityDeath", function(entity, attacker) {
    var updatable = MobRegistry.getEntityUpdatable(entity);
    if (updatable) {
        updatable.callControllerEvent("death", attacker);
    }
});
Callback.addCallback("EntityHurt", function(attacker, victim, damage) {
    var updatable = MobRegistry.getEntityUpdatable(victim);
    if (updatable) {
        updatable.callControllerEvent("hurtBy", attacker, damage);
    }
});
Callback.addCallback("ProjectileHitEntity", function(projectile, entity) {
    var updatable = MobRegistry.getEntityUpdatable(entity);
    if (updatable) {
        updatable.callControllerEvent("projectileHit", projectile);
    }
});
var ENTITY_MIN_SPAWN_DIS = 32;
var ENTITY_MAX_SPAWN_DIS = 63;
var EntitySpawnRegistry = {
    spawnData: [],
    registerSpawn: function(entityType, rarity, condition, denyNaturalDespawn) {
        if (!condition) {
            condition = function() {
                return parseInt(Math.random() * 3 + 1);
            };
        }
        this.spawnData.push({
            type: entityType,
            rarity: rarity,
            condition: condition,
            denyNaturalDespawn: denyNaturalDespawn
        });
    },
    getRandomSpawn: function(rarityMultiplier) {
        var spawn = this.spawnData[parseInt(Math.random() * this.spawnData.length)];
        if (spawn) {
            var chance = spawn.rarity * this.spawnData.length * rarityMultiplier;
            if (Math.random() < chance) {
                return spawn;
            }
        }
    },
    getRandPosition: function() {
        var angle = Math.random() * Math.PI * 2;
        var dist = Math.random() * (ENTITY_MAX_SPAWN_DIS - ENTITY_MIN_SPAWN_DIS) + ENTITY_MIN_SPAWN_DIS;
        return {
            x: getPlayerX() + Math.sin(angle) * dist,
            z: getPlayerZ() + Math.cos(angle) * dist
        };
    },
    executeSpawn: function(spawn, position) {
        position = position || this.getRandPosition();
        var api = {
            y: -1,
            accessY: function() {
                if (this.y == -1) {
                    this.y = WorldGenerationUtils.findLowSurface(position.x, position.z).y + 1;
                }
                return this.y;
            },
            condition: spawn.condition
        };
        var count = api.condition(position.x, position.z);
        if (count > 0) {
            position.y = api.accessY();
            for (var i = 0; i < count; i++) {
                var entity = EntityAPI.spawnCustomAtCoords(spawn.type, position);
                entity.allowNaturalDespawn(!spawn.denyNaturalDespawn);
                EntityAPI.setVelocity(entity.entity, Math.random() - 0.5, 0, Math.random() - 0.5);
            }
        }
    },
    counter: 0,
    tick: function() {
        if (this.counter++ % 100 == 0) {
            var spawn = this.getRandomSpawn(5 / 60);
            if (spawn) {
                this.executeSpawn(spawn);
            }
        }
    },
    onChunkGenerated: function(x, z) {
        for (var i = 0; i < this.spawnData.length; i++) {
            var position = {
                x: (x + Math.random()) * 16,
                z: (z + Math.random()) * 16
            };
            var spawn = this.getRandomSpawn(2 / this.spawnData.length);
            if (spawn) {
                this.executeSpawn(spawn, position);
            }
        }
    }
};
Callback.addCallback("tick", function() {
    EntitySpawnRegistry.tick();
});
Callback.addCallback("GenerateChunk", function(x, z) {
    EntitySpawnRegistry.onChunkGenerated(x, z);
});
var PlayerAPI = {
    get: function() {
        return getPlayerEnt();
    },
    getNameForEnt: function(ent) {
        return Player.getName(ent);
    },
    getName: function() {
        return this.getNameForEnt(this.get());
    },
    getDimension: function() {
        return Player.getDimension();
    },
    isPlayer: function(ent) {
        return Player.isPlayer(ent);
    },
    getPointed: function() {
        var pointedData = Player.getPointed();
        var pos = pointedData.pos;
        pointedData.block = WorldAPI.getBlock(pos.x, pos.y, pos.side);
        return pointedData;
    },
    getInventory: function(loadPart, handleEnchant, handleNames) {
        MCSystem.throwException("Player.getInventory() method is deprecated");
    },
    addItemToInventory: function(id, count, data, extra, preventDrop) {
        Player.addItemInventory(id, count, data, preventDrop, extra);
    },
    getCarriedItem: function(handleEnchant, handleNames) {
        return Player.getCarriedItem();
    },
    setCarriedItem: function(id, count, data, extra) {
        return Player.setCarriedItem(id, count, data, extra);
    },
    getOffhandItem: function() {
        return Player.getOffhandItem();
    },
    setOffhandItem: function(id, count, data, extra) {
        return Player.setOffhandItem(id, count, data, extra);
    },
    decreaseCarriedItem: function(count) {
        if (count + "" == "undefined") {
            count = 1;
        }
        var carried = this.getCarriedItem(true, true);
        this.setCarriedItem(carried.id, carried.count - count, carried.data, carried.extra);
    },
    getInventorySlot: function(slot) {
        return Player.getInventorySlot(slot);
    },
    setInventorySlot: function(slot, id, count, data, extra) {
        return Player.setInventorySlot(slot, id, count, data, extra);
    },
    getArmorSlot: function(slot) {
        return Player.getArmorSlot(slot);
    },
    setArmorSlot: function(slot, id, count, data, extra) {
        return Player.setArmorSlot(slot, id, count, data, extra);
    },
    getSelectedSlotId: function() {
        return Player.getSelectedSlotId();
    },
    setSelectedSlotId: function(slot) {
        return Player.setSelectedSlotId(slot);
    },
    setPosition: function(x, y, z) {
        Entity.setPosition(getPlayerEnt(), x, y, z);
    },
    getPosition: function() {
        var pos = Entity.getPosition(getPlayerEnt());
        return {
            x: pos[0],
            y: pos[1],
            z: pos[2]
        };
    },
    addPosition: function(x, y, z) {
        var pos = this.getPosition();
        this.setPosition(pos.x + x, pos.y + y, pos.z + z);
    },
    setVelocity: function(x, y, z) {
        Entity.setVelocity(getPlayerEnt(), x, y, z);
    },
    getVelocity: function() {
        var vel = Entity.getVelocity(getPlayerEnt());
        return {
            x: vel[0],
            y: vel[1],
            z: vel[2]
        };
    },
    addVelocity: function(x, y, z) {
        var vel = this.getVelocity();
        this.setVelocity(vel.x + x, vel.y + y, vel.z + z);
    },
    experience: function() {
        return {
            get: this.getExperience,
            set: this.setExperience,
            add: this.addExperience
        };
    },
    getExperience: function() {
        return Player.getExp();
    },
    setExperience: function(exp) {
        Player.setExp(exp);
    },
    addExperience: function(exp) {
        Player.addExp(exp);
    },
    level: function() {
        return {
            get: this.getLevel,
            set: this.setLevel,
            add: this.addLevel
        };
    },
    getLevel: function() {
        return Player.getLevel();
    },
    setLevel: function(level) {
        Player.setLevel(level);
    },
    addLevel: function(level) {
        this.setLevel(this.getLevel() + level);
    },
    flying: function() {
        return {
            set: this.setFlying,
            get: this.getFlying,
            getEnabled: this.getFlyingEnabled,
            setEnabled: this.setFlyingEnabled
        };
    },
    getFlyingEnabled: function() {
        return Player.canFly();
    },
    setFlyingEnabled: function(enabled) {
        Player.setCanFly(enabled);
    },
    getFlying: function() {
        return Player.isFlying();
    },
    setFlying: function(enabled) {
        Player.setFlying(enabled);
    },
    exhaustion: function() {
        return {
            get: this.getExhaustion,
            set: this.setExhaustion
        };
    },
    getExhaustion: function() {
        return Player.getExhaustion();
    },
    setExhaustion: function(value) {
        Player.setExhaustion(value);
    },
    hunger: function() {
        return {
            get: this.getHunger,
            set: this.setHunger
        };
    },
    getHunger: function() {
        return Player.getHunger();
    },
    setHunger: function(value) {
        Player.setHunger(value);
    },
    saturation: function() {
        return {
            get: this.getSaturation,
            set: this.setSaturation
        };
    },
    getSaturation: function() {
        return Player.getSaturation();
    },
    setSaturation: function(value) {
        Player.setSaturation(value);
    },
    health: function() {
        return {
            get: this.getHealth,
            set: this.setHealth
        };
    },
    getHealth: function() {
        return Entity.getHealth(getPlayerEnt());
    },
    setHealth: function(value) {
        Entity.setHealth(getPlayerEnt(), value);
    },
    score: function() {
        return {
            get: this.getScore
        };
    },
    getScore: function() {
        return Player.getScore();
    },
    setFov: function(fov) {
        Player.setFov(fov);
    },
    resetFov: function() {
        Player.resetFov();
    },
    setCameraEntity: function(ent) {
        Player.setCameraEntity(ent);
    },
    resetCameraEntity: function() {
        Player.resetCameraEntity();
    },
    setAbility(ability, value) {
        Player.setAbility(ability, value);
    },
    getFloatAbility(ability) {
        return Player.getFloatAbility(ability);
    },
    getBooleanAbility(ability) {
        return Player.getBooleanAbility(ability);
    }
};
var ANIMATION_BASE_ENTITY = 10;
var AnimationRegistry = {
    animationList: [],
    resetEngine: function() {
        this.animationList = [];
    },
    registerAnimation: function(anim) {
        this.animationList.push(anim);
    },
    getEntityArray: function() {
        var entities = [];
        try {
            for (var i in this.animationList) {
                var anim = this.animationList[i];
                if (anim.entity && !anim.remove) {
                    entities.push(parseInt(anim.entity));
                }
            }
        } catch (e) {
            print(e);
        }
        return {
            entites: entities
        };
    },
    onAttack: function(victim) {
        for (var i in this.animationList) {
            var anim = this.animationList[i];
            if (anim.entity == victim && !anim.remove) {
                preventDefault();
                anim.onAttack();
            }
        }
    }
};
Callback.addCallback("PlayerAttack", function(attacker, victim) {
    AnimationRegistry.onAttack(victim);
});

function AnimationBase(x, y, z) {
    this.render = null;
    Saver.registerObject(this, nonSavesObjectSaver);
    this.setPos = function(x, y, z) {
        this.coords = {
            x: x,
            y: y,
            z: z
        };
        if (this.render) {
            this.render.setPos(x, y, z);
        }
    };
    this.setInterpolationEnabled = function(enabled) {
        if (this.render) {
            this.render.setInterpolationEnabled(enabled);
        }
    }
    this.setIgnoreBlocklight = function(ignore) {
        if (this.render) {
            this.render.setIgnoreBlocklight(ignore);
        }
    }
    this.setBlockLightPos = function(x, y, z) {
        if (this.render) {
            this.render.setBlockLightPos(x, y, z);
        }
    }
    this.resetBlockLightPos = function() {
        if (this.render) {
            this.render.resetBlockLightPos();
        }
    }
    this.setSkylightMode = function() {
        this.setBlockLightPos(this.coords.x, 256, this.coords.z);
        this.setIgnoreBlocklight(false);
    }
    this.setBlocklightMode = function() {
        this.resetBlockLightPos();
        this.setIgnoreBlocklight(false);
    }
    this.setIgnoreLightMode = function() {
        this.resetBlockLightPos();
        this.setIgnoreBlocklight(true);
    }

    this.exists = function() {
        return !!this.render && this.render.exists();
    }

    this.transform = function() {
        if (!this.render) {
            Logger.Log("transform() should be called only after load()", "WARNING");
            return null;
        }
        return this.render.transform;
    };

    this.getShaderUniforms = function() {
        if (!this.render) {
            Logger.Log("getShaderUniforms() should be called only after load()", "WARNING");
            return null;
        }
        return this.render.getShaderUniforms();
    }

    /* transformations are formatted as [{name: "name", params: [arg1, arg2, arg3], ...}]*/
    this.newTransform = function(transformations, noClear) {
        var transform = this.transform();
        if (transform) {
            transform.lock();
            if (!noClear) {
                transform.clear();
            }
            for (var i in transformations) {
                var t = transformations[i];
                transform[t.name].apply(transform, t.params);
            }
            transform.unlock();
        }
    }

    this.setPos(x, y, z);
    this.description = {};
    this.createRenderIfNeeded = function() {
        if (!this.description) {
            return;
        }
        if (!this.render) {
            if (this.description.mesh) {
                this.render = StaticRenderer.createStaticRenderer(-1, this.coords.x, this.coords.y, this.coords.z);
            } else if (this.description.render) {
                this.render = StaticRenderer.createStaticRenderer(this.description.render, this.coords.x, this.coords.y, this.coords.z);
            }
        }
        if (this.render) {
            if (this.description.skin) {
                this.render.setSkin(this.description.skin);
            }
            if (this.description.scale) {
                this.render.setScale(this.description.scale);
            }
            if (this.description.mesh) {
                this.render.setMesh(this.description.mesh);
                this.render.setRenderer(-1);
            } else if (this.description.render) {
                this.render.setRenderer(this.description.render);
                this.render.setMesh(null);
            }
            if (this.description.material) {
                this.render.setMaterial(this.description.material);
            }
        }
    };
    this.isLoaded = false;
    this.updateRender = function() {
        if (this.isLoaded) {
            this.createRenderIfNeeded();
        } else {
            if (this.render) {
                this.render.remove();
                this.render = null;
            }
        }
    };
    this.load = function() {
        this.remove = false;
        this.isLoaded = true;
        this.updateRender();
    };
    this.loadCustom = function(func) {
        this.load();
        this.update = func;
        Updatable.addUpdatable(this);
    };
    this.getAge = function() {
        return 0;
    };
    this.refresh = function() {
        this.updateRender();
    };
    this.describe = function(description) {
        for (var name in description) {
            this.description[name] = description[name];
        }
        this.updateRender();
    };
    this.getRenderAPI = function(base) {
        if (!this.description.renderAPI) {
            this.description.renderAPI = new RenderAPI(base);
        }
        return this.description.renderAPI;
    };
    this.destroy = function() {
        this.remove = true;
        this.isLoaded = false;
        this.updateRender();
    };
}

var AnimationItemLoadHelper = {
    postedAnimations: [],
    postRequired: true,
    session: 1,

    onLevelDisplayed: function() {
        this.postRequired = false;
        for (var i in this.postedAnimations) {
            var anim = this.postedAnimations[i];
            if (anim && anim.__postedItem) {
                anim.describeItem(anim.__postedItem);
            }
        }
        this.postedAnimations = [];
    },

    onLevelLeft: function() {
        this.postRequired = true;
        this.postedAnimations = [];
        this.session++;
    },

    handleItemDescribeRequest: function(anim, item) {
        if (this.postRequired) {
            if (anim.__session != this.session) {
                anim.__session = this.session;
                this.postedAnimations.push(anim);
            }
            anim.__postedItem = item;
            return false;
        } else {
            return true;
        }
    }
}

Callback.addCallback("LevelDisplayed", function() {
    AnimationItemLoadHelper.onLevelDisplayed();
});

Callback.addCallback("LevelLeft", function() {
    AnimationItemLoadHelper.onLevelLeft();
});

var USE_ALTERNATIVE_ITEM_MODEL = false;

function AnimationItem(x, y, z) {
    this.parent = AnimationBase;
    this.parent(x, y, z);

    this.__rotation = [0, 0, 0];
    this.__scale = 1;

    this.describeItemDefault = function(item) {
        if (!AnimationItemLoadHelper.handleItemDescribeRequest(this, item)) {
            return;
        }
        if (!item.size) {
            item.size = 0.5;
        }
        var rotation = item.rotation;
        if (!rotation || typeof(rotation) == "string") {
            rotation = [0, 0, 0];
            if (rotation == "x") {
                rotation = [0, 0, Math.PI / 2];
            }
            if (rotation == "z") {
                rotation = [Math.PI / 2, 0, 0];
            }
        }
        var lastMesh = this.__itemMesh;

        var itemModel = ItemModel.getForWithFallback(item.id, item.data);
        var glint = true || item.glint || Item.isGlintItemInstance(item.id, item.data, item.extra);
        var material = glint ? itemModel.getWorldGlintMaterialName() : itemModel.getWorldMaterialName();
        this.__itemMesh = itemModel.getItemRenderMesh(item.count > 1 ? (item.count > 20 ? 3 : 2) : 1, !item.notRandomize);

        this.describe({
            mesh: this.__itemMesh,
            skin: item.skin || itemModel.getWorldTextureName(),
            material: item.material || material
        })

        this.__scale = item.size;
        this.__rotation = rotation;
        this.resetTransform();

        if (lastMesh) {
            ItemModel.releaseMesh(lastMesh);
        }

        /*var itemModel = Renderer.getItemModel(item.id, item.count, item.data, item.size, rotation[0], rotation[1], rotation[2], !item.notRandomize);
        if (itemModel != null) {
            itemModel.setFinalizeable(false);
            this.describe({render: itemModel.getRenderType()});
        }
        if (this.lastItemModel && this.lastItemModel != itemModel) {
            this.lastItemModel.release();
        }
        this.lastItemModel = itemModel;*/
    };
    this.describeItemAlternative = function(item, offset) {
        if (!item.size) {
            item.size = 0.5;
        }
        var render = new RenderAPI({
            empty: true
        });
        var stateName = "__item" + item.id + "|" + item.count + "|" + item.data + "|" + item.size + "|" + item.rotation + "|" + !item.notRandomize;
        if (offset) {
            stateName += "|" + offset.x + "|" + offset.y + "|" + offset.z;
        } else {
            offset = {
                x: 0,
                y: 0,
                z: 0
            };
        }
        if (!render.loadState(stateName)) {
            render.createBasicModel();
            var model = [];
            var size = parseInt(item.size * 16);
            var addBox = function(z, rx, ry) {
                model.push({
                    type: "box",
                    uv: {
                        x: 0,
                        y: 0
                    },
                    size: {
                        x: size,
                        y: size,
                        z: 0
                    },
                    coords: {
                        x: rx + offset.x * 16,
                        y: 25 + ry - offset.y * 16,
                        z: z - offset.z * 16
                    }
                });
            };
            var fract = Math.min(64, size);
            var width = size / 16;
            for (var z = 0; z < item.count; z++) {
                var randomX = 0,
                    randomY = 0;
                if (z > 0 && !item.notRandomize) {
                    randomX = Math.random() * 5 - 2.5;
                    randomY = Math.random() * 5 - 2.5;
                }
                for (var f = 0; f <= width; f += width / fract) {
                    addBox((z - 0.5 - item.count / 2) * width + f, randomX, randomY);
                }
            }
            render.setPart("body", model, {
                width: size,
                height: size
            });
            render.saveState(stateName);
        }
        this.describe({
            renderAPI: render,
            skin: ItemIconSource.getIconName(item.id, item.data)
        });
    };
    this.describeItem = this.describeItemDefault;
    this.tick = function() {};

    this.resetTransform = function() {
        var transform = this.transform();
        if (transform) {
            transform.lock().clear().rotate(this.__rotation[0], this.__rotation[1], this.__rotation[2]).scale(this.__scale, this.__scale, this.__scale).unlock();
        }
    }

    this.setItemRotation = function(x, y, z) {
        if (this.__postedItem) {
            this.__postedItem.rotation = [x, y, z];
        }
        this.__rotation = [x, y, z];
        this.resetTransform();
    }

    this.setItemSize = function(size) {
        if (this.__postedItem) {
            this.__postedItem.size = size;
        }
        this.__scale = size;
        this.resetTransform();
    }

    this.setItemSizeAndRotation = function(size, x, y, z) {
        this.setItemSize(size);
        this.setItemRotation(x, y, z);
    }

    this._destroy = this.destroy;
    this.destroy = function() {
        this._destroy();
        this.__postedItem = null;
        if (this.lastItemModel) {
            this.lastItemModel.release();
        }
    };

    this._load = this.load;
    this.load = function(tickFunc) {
        this._load(tickFunc);
        this.resetTransform();
    }
}
var __RAD_TO_DEGREES = 180 / Math.PI;

function __radToDegrees(x) {
    return x * __RAD_TO_DEGREES;
}

function __degreesToRad(x) {
    return x / __RAD_TO_DEGREES;
}

// ------------------------------------------------------

function AddonEntity(id, type) {
    this.id = id;
    this.type = type;

    this.getCommandCondition = function() {
        var position = EntityAPI.getPosition(this.id);
        return "@e[x=" + position.x + ",y=" + position.y + ",z=" + position.z + ",r=0.0001]";
    }

    this.exec = function(command) {
        return Commands.exec("execute " + this.getCommandCondition() + " ~ ~ ~ " + command);
    }

    this.execAt = function(command, x, y, z) {
        return Commands.exec("execute " + this.getCommandCondition() + " " + x + " " + y + " " + z + " " + command);
    }
};

var AddonEntityRegistry = {
    data: {},
    awaitCallback: null,

    spawn: function(x, y, z, nameID) {
        var result = {
            entity: null
        };
        this.awaitCallback = function(entity) {
            result.entity = new AddonEntity(entity, nameID);
            AddonEntityRegistry.data[entity] = result.entity;
            return true;
        }
        Commands.exec("summon " + nameID + " " + x + " " + y + " " + z);
        this.awaitCallback = null;
        return result.entity;
    },

    getEntityData: function(entity) {
        return this.data[entity] || null;
    },

    onEntityAdded: function(entity) {
        if (this.awaitCallback) {
            if (this.awaitCallback(entity)) {
                this.awaitCallback = null;
            }
        }
    }
};

Callback.addCallback("EntityAdded", function(entity) {
    AddonEntityRegistry.onEntityAdded(entity);
});

// ------------------------------------------------------

var EntityAPI = {
    getAll: function() {
        return Entity.getAll();
    },
    getAllJS: function() {
        return Entity.getAll();
    },
    getExtra: function(ent, name) {
        logDeprecation("Entity.getExtra");
        return null;
    },
    putExtra: function(ent, name, extra) {
        logDeprecation("Entity.putExtra");
    },
    getExtraJson: function(ent, name) {
        try {
            return JSON.parse(this.getExtra(ent, name)) || {};
        } catch (e) {
            return {};
        }
    },
    putExtraJson: function(ent, name, obj) {
        logDeprecation("Entity.putExtraJson");
    },
    addEffect: function(ent, effectId, effectData, effectTime, ambiance, particles) {
        Entity.addEffect(ent, effectId, effectData, effectTime, ambiance, particles);
    },
    clearEffect: function(ent, id) {
        Entity.removeEffect(ent, id);
    },
    clearEffects: function(ent) {
        Entity.removeAllEffects(ent);
    },
    damageEntity: function(ent, damage, cause, params) {
        Entity.dealDamage(ent, damage, cause, params);
    },
    healEntity: function(ent, heal) {
        var health = Entity.getHealth(ent) + heal;
        var maxHealth = Entity.getMaxHealth(ent);
        Entity.setHealth(ent, Math.min(health, maxHealth));
    },
    getType: function(ent) {
        return Entity.getEntityTypeId(ent);
    },
    getTypeName: function(ent) {
        return Entity.getTypeName(ent);
    },
    getTypeUniversal: function(ent) {
        var ent = AddonEntityRegistry.getEntityData(ent);
        if (ent != null) {
            return ent.type;
        }
        return Entity.getEntityTypeId(ent);
    },
    getTypeAddon: function(ent) {
        var ent = AddonEntityRegistry.getEntityData(ent);
        if (ent != null) {
            return ent.type;
        }
        return null;
    },
    getCompoundTag: function(ent) {
        return Entity.getCompoundTag(ent);
    },
    setCompoundTag: function(ent, tag) {
        Entity.setCompoundTag(ent, tag);
    },
    setHitbox: function(ent, w, h) {
        Entity.setCollisionSize(ent, w, h);
    },
    isExist: function(entity) {
        return Entity.isValid(entity);
    },
    getDimension: function(entity) {
        return Entity.getDimension(entity);
    },
    spawn: function(x, y, z, type, skin) {
        if (typeof(type) == "string") {
            var addon = AddonEntityRegistry.spawn(x, y, z, type);
            if (addon != null) {
                return addon.id;
            }
        }
        return Level.spawnMob(x, y, z, type, skin);
    },
    spawnAtCoords: function(coords, type, skin) {
        return this.spawn(coords.x, coords.y, coords.z, type, skin);
    },
    spawnCustom: function(name, x, y, z, extra) {
        return this.spawnCustomAtCoords(name, {
            x: x,
            y: y,
            z: z
        }, extra);
    },
    spawnCustomAtCoords: function(name, coords, extra) {
        return MobRegistry.spawnEntityAsPrototype(name, coords, extra);
    },
    spawnAddon: function(x, y, z, name) {
        return AddonEntityRegistry.spawn(x, y, z, name);
    },
    spawnAddonAtCoords: function(coords, name) {
        return AddonEntityRegistry.spawn(coords.x, coords.y, coords.z, name);
    },
    getAddonEntity: function(entity) {
        return AddonEntityRegistry.getEntityData(entity);
    },
    remove: function(entity) {
        Entity.remove(entity);
    },
    getCustom: function(entity) {
        return MobRegistry.getEntityUpdatable(entity);
    },
    getAge: function(ent) {
        return Entity.getAnimalAge(ent);
    },
    setAge: function(ent, age) {
        return Entity.setAnimalAge(ent, age);
    },
    getSkin: function(ent) {
        return Entity.getMobSkin(ent);
    },
    setSkin: function(ent, skin) {
        Entity.setMobSkin(ent, skin);
    },
    setTexture: function(ent, texture) {
        this.setSkin(ent, texture.getTexture());
    },
    getRender: function(ent) {
        return Entity.getRenderType(ent);
    },
    setRender: function(ent, render) {
        Entity.setRenderType(ent, render);
    },
    rideAnimal: function(ent1, ent2) {
        Entity.rideAnimal(ent1, ent2);
    },
    getNameTag: function(ent) {
        return Entity.getNameTag(ent);
    },
    setNameTag: function(ent, tag) {
        return Entity.setNameTag(ent, tag);
    },
    getTarget: function(ent) {
        return Entity.getTarget(ent);
    },
    setTarget: function(ent, target) {
        return Entity.setTarget(ent, target);
    },
    getMobile: function(ent, mobile) {
        Entity.isImmobile(ent);
    },
    setMobile: function(ent, mobile) {
        Entity.setImmobile(ent, !mobile);
    },
    getSneaking: function(ent) {
        return Entity.isSneaking(ent);
    },
    setSneaking: function(ent, sneak) {
        return Entity.setSneaking(ent, sneak);
    },
    getRider: function(ent) {
        return Entity.getRider(ent);
    },
    getRiding: function(ent) {
        return Entity.getRiding(ent);
    },
    setFire: function(ent, fire, force) {
        Entity.setFireTicks(ent, fire || 0, force);
    },
    health: function(entity) {
        return {
            get: function() {
                return this.getHealth(entity);
            },
            set: function(health) {
                this.setHealth(entity, health);
            },
            getMax: function() {
                return this.getMaxHealth(entity);
            },
            setMax: function(health) {
                this.setMaxHealth(entity, health);
            }
        };
    },
    getHealth: function(ent) {
        return Entity.getHealth(ent);
    },
    setHealth: function(ent, health) {
        Entity.setHealth(ent, health);
    },
    getMaxHealth: function(ent) {
        return Entity.getMaxHealth(ent);
    },
    setMaxHealth: function(ent, health) {
        Entity.setMaxHealth(ent, health);
    },
    setPosition: function(ent, x, y, z) {
        Entity.setPosition(ent, x, y, z);
    },
    getPosition: function(ent) {
        var pos = Entity.getPosition(ent);
        return {
            x: pos[0],
            y: pos[1],
            z: pos[2]
        };
    },
    addPosition: function(ent, x, y, z) {
        var pos = this.getPosition(ent);
        this.setPosition(ent, pos.x + x, pos.y + y, pos.z + z);
    },
    setVelocity: function(ent, x, y, z) {
        Entity.setVelocity(ent, x, y, z);
    },
    getVelocity: function(ent) {
        var vel = Entity.getVelocity(ent);
        return {
            x: vel[0],
            y: vel[1],
            z: vel[2]
        };
    },
    addVelocity: function(ent, x, y, z) {
        var vel = this.getVelocity(ent);
        this.setVelocity(ent, vel.x + x, vel.y + y, vel.z + z);
    },
    getDistanceBetweenCoords: function(coords1, coords2) {
        return Math.sqrt(Math.pow(coords1.x - coords2.x, 2) + Math.pow(coords1.y - coords2.y, 2) + Math.pow(coords1.z - coords2.z, 2));
    },
    getDistanceToCoords: function(ent, coords) {
        return this.getDistanceBetweenCoords(this.getPosition(ent), coords);
    },
    getDistanceToEntity: function(ent1, ent2) {
        return this.getDistanceBetweenCoords(this.getPosition(ent1), this.getPosition(ent2));
    },
    getXZPlayerDis: function(entity) {
        var dx = getPlayerX() - Entity.getX(entity);
        var dz = getPlayerZ() - Entity.getZ(entity);
        return Math.sqrt(dx * dx + dz * dz);
    },
    getLookAngle: function(ent) {
        return {
            pitch: __degreesToRad(-Entity.getPitch(ent)),
            yaw: __degreesToRad(Entity.getYaw(ent))
        };
    },
    setLookAngle: function(ent, yaw, pitch) {
        Entity.setRot(ent, __radToDegrees(yaw) || 0, __radToDegrees(-pitch) || 0);
    },
    getLookVectorByAngle: function(angle) {
        return {
            x: -Math.sin(angle.yaw) * Math.cos(angle.pitch),
            y: Math.sin(angle.pitch),
            z: Math.cos(angle.yaw) * Math.cos(angle.pitch)
        };
    },
    getLookVector: function(ent) {
        var angle = this.getLookAngle(ent);
        return this.getLookVectorByAngle(angle);
    },
    getLookAt: function(ent, x, y, z) {
        var position = this.getPosition(ent);
        var delta = {
            x: x - position.x,
            y: y - position.y,
            z: z - position.z
        };
        delta.size = Math.sqrt(delta.x * delta.x + delta.y * delta.y + delta.z * delta.z);
        delta.x /= delta.size;
        delta.y /= delta.size;
        delta.z /= delta.size;
        var pitch = Math.asin(delta.y);
        var yaw = Math.atan2(-delta.x, delta.z);
        return {
            yaw: yaw,
            pitch: pitch
        };
    },
    lookAt: function(ent, x, y, z) {
        var look = this.getLookAt(ent, x, y, z);
        this.setLookAngle(ent, look.yaw, look.pitch);
    },
    lookAtCoords: function(ent, coords) {
        this.lookAt(ent, coords.x, coords.y, coords.z);
    },
    moveToTarget: function(ent, target, params) {
        var position = this.getPosition(ent);
        var velocity = this.getVelocity(ent);
        var delta = {
            x: target.x - position.x,
            y: target.y - position.y,
            z: target.z - position.z
        };
        delta.size = Math.sqrt(delta.x * delta.x + delta.y * delta.y + delta.z * delta.z);
        var speed = Math.min(delta.size, params.speed || 0);
        delta.x *= speed / delta.size;
        delta.y *= speed / delta.size;
        delta.z *= speed / delta.size;
        if (params.denyY) {
            delta.y = velocity.y;
            var jump = params.jumpVel || 0;
            if (jump && Math.abs(velocity.y + 0.0781) < 0.001 && (Math.abs(velocity.x) < 0.001 && Math.abs(delta.x) > 0.1 * speed || Math.abs(velocity.z) < 0.001 && Math.abs(delta.z) > 0.1 * speed)) {
                delta.y = jump;
            }
        }
        this.setVelocity(ent, delta.x, delta.y, delta.z);
    },
    moveToAngle: function(ent, angle, params) {
        speed = (params.speed || 0) + 1;
        var vec = this.getLookVectorByAngle(angle);
        var pos = this.getPosition(ent);
        var target = {
            x: pos.x + vec.x * speed,
            y: pos.y + vec.y * speed,
            z: pos.z + vec.z * speed
        };
        this.moveToTarget(ent, target, params);
    },
    moveToLook: function(ent, params) {
        this.moveToAngle(ent, this.getLookAngle(ent), params);
    },
    getMovingVector: function(ent) {
        var vel = this.getVelocity(ent);
        vel.size = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z);
        vel.xzsize = Math.sqrt(vel.x * vel.x + vel.z * vel.z);
        vel.x /= vel.size;
        vel.y /= vel.size;
        vel.z /= vel.size;
        return vel;
    },
    getMovingAngle: function(ent) {
        var vec = this.getMovingVector(ent);
        return {
            pitch: Math.asin(vec.y) || 0,
            yaw: Math.atan2(-vec.x, vec.z) || 0
        };
    },
    getMovingAngleByPositions: function(pos1, pos2) {
        logDeprecation("Entity.getMovingAngleByPositions");
    },
    findNearest: function(coords, type, maxRange) {
        var data;
        if (type) {
            data = EntityDataRegistry.getDataForType(type);
        } else {
            data = EntityDataRegistry.getAllData();
        }
        var closest = {
            entity: null,
            dis: 999999999
        };
        for (var entity in data) {
            var dis = this.getDistanceToCoords(parseInt(entity), coords);
            if (dis < closest.dis) {
                closest.entity = parseInt(entity);
                closest.dis = dis;
            }
        }
        if (maxRange && closest.dis > maxRange) {
            return null;
        }
        return closest.entity;
    },
    getAllInRange: function(coords, maxRange, type) {
        var data;
        if (type) {
            data = EntityDataRegistry.getDataForType(type);
        } else {
            data = EntityDataRegistry.getAllData();
        }
        var entites = [];
        for (var entity in data) {
            var dis = this.getDistanceToCoords(parseInt(entity), coords);
            if (dis < maxRange) {
                entites.push(parseInt(entity));
            }
        }
        return entites;
    },
    getInventory: function(ent, handleNames, handleEnchant) {
        MCSystem.throwException("Entity.getInventory() method is deprecated");
    },
    getArmorSlot: function(ent, slot) {
        return Entity.getArmorSlot(ent, slot);
    },
    setArmorSlot: function(ent, slot, id, count, data, extra) {
        return Entity.setArmorSlot(ent, slot, id, count, data, extra);
    },
    getCarriedItem: function(ent, bool1, bool2) {
        return Entity.getCarriedItem(ent);
    },
    setCarriedItem: function(ent, id, count, data, extra) {
        return Entity.setCarriedItem(ent, id, count, data, extra);
    },
    getOffhandItem: function(ent, bool1, bool2) {
        return Entity.getOffhandItem(ent);
    },
    setOffhandItem: function(ent, id, count, data, extra) {
        return Entity.setOffhandItem(ent, id, count, data, extra);
    },
    getDroppedItem: function(ent) {
        return Entity.getDroppedItem(ent);
    },
    setDroppedItem: function(ent, id, count, data, extra) {
        return Entity.setDroppedItem(ent, id, count, data, extra);
    },
    getProjectileItem: function(projectile) {
        return Entity.getProjectileItem(projectile);
    },
    getAttribute: function(ent, attribute) {
        return Entity.getAttribute(ent, attribute);
    },
    getPathNavigation: function(ent) {
        return Entity.getPathNavigation(ent);
    },
    getAllInsideBox: function(pos1, pos2, type, flag) {
        if (type == undefined && flag == undefined) {
            flag = true;
            type = 255;
        }
        return Entity.getEntitiesInsideBox(pos1.x, pos1.y, pos1.z, pos2.x, pos2.y, pos2.z, type, flag || false);
    }
};
Callback.addCallback("LevelLeft", function() {
    ResetInGameAPIs();
});
Callback.addCallback("NativeCommand", function(commandString) {
    var command = commandString.split(" ");
    if (command.shift() == "c") {
        if (command[0] == "gm") {
            var gm = parseInt(command[1]);
            Level.setGameMode(gm);
        }
        if (command[0] == "give") {
            var item = parseInt(command[1]) || 0;
            var count = parseInt(command[1]) || 64;
            var data = parseInt(command[1]) || 0;
            Player.addItemInventory(item, count, data);
        }
    }
});
var CONSTANT_REPLACEABLE_TILES = {
    0: true,
    8: true,
    9: true,
    10: true,
    11: true,
    31: true,
    51: true,
    78: true,
    106: true
};

function canTileBeReplaced(id, data) {
    if (id == 175 && (data % 8 == 2 || data % 8 == 3)) return true;
    return CONSTANT_REPLACEABLE_TILES[id] || false;
}
var CONSTANT_VANILLA_UI_TILES = {
    23: true, // dispenser
    25: true, // note block
    26: true, // bed
    54: true, // chest
    58: true, // workbench
    61: true,
    62: true, // furnace
    64: true, // door
    69: true, // lever
    77: true, // stone button
    84: true, // jukebox
    92: true, // cake
    93: true,
    94: true, // repeater
    96: true, // wooden trapdoor
    107: true, // fence gate
    116: true, // enchanting table
    117: true, // brewing stand
    122: true, // dragon egg
    125: true, // dropper
    130: true, // ender chest
    138: true, // beacon
    143: true, // wooden button
    145: true, // anvil
    146: true, // trapped chest
    149: true,
    150: true, // comparator
    151: true,
    178: true, // day light detector
    154: true, // hopper
    183: true,
    184: true,
    185: true,
    186: true,
    187: true, // fence gate 2
    193: true,
    194: true,
    195: true,
    196: true,
    197: true, // door 2
    205: true,
    218: true, // shulker box
    395: true,
    396: true,
    397: true,
    398: true,
    399: true, // wooden button 2
    400: true,
    401: true,
    402: true,
    403: true,
    404: true, // wooden trapdoor 2
    449: true, // lectern
    450: true, // grindstone
    451: true,
    469: true, // blast furnace
    452: true, // stonecutter
    453: true,
    454: true, // smoker
    455: true, // cartography table
    458: true, // barrel
    459: true, // loom
    461: true, // bell
};

function doesVanillaTileHasUI(id) {
    return CONSTANT_VANILLA_UI_TILES[id];
}

function setPlayerItem(id, count, data, extra) {
    Player.setCarriedItem(id, count, data, extra);
}

Callback.addCallback("ItemUse", function(coords, item, block, isExternal, player) {
    var blockSource = BlockSource.getDefaultForActor(player);
    var placeFunc = BlockRegistry.getPlaceFunc(item.id);
    if (TileEntity.isTileEntityBlock(block.id)) {
        var tileEntity = TileEntity.getTileEntity(coords.x, coords.y, coords.z, blockSource);
        if (!tileEntity) {
            tileEntity = TileEntity.addTileEntity(coords.x, coords.y, coords.z, blockSource);
        }
        if (tileEntity && tileEntity.onItemClick(item.id, item.count, item.data, coords, player, item.extra)) {
            preventDefault();
            return;
        }
    }
    if (Entity.isSneaking(player) || !doesVanillaTileHasUI(block.id)) {
        if (TileEntity.isTileEntityBlock(item.id)) {
            var tile = blockSource.getBlockId(coords.relative.x, coords.relative.y, coords.relative.z);
            if (canTileBeReplaced(tile)) {
                if (placeFunc) {
                    var placeCoords = placeFunc(coords, item, block, player, blockSource) || coords.relative;
                    var tileEntity = TileEntity.addTileEntity(placeCoords.x, placeCoords.y, placeCoords.z, blockSource);
                } else {
                    blockSource.setBlock(coords.relative.x, coords.relative.y, coords.relative.z, item.id, item.data);
                    var tileEntity = TileEntity.addTileEntity(coords.relative.x, coords.relative.y, coords.relative.z, blockSource);
                }
                if (GameAPI.isItemSpendingAllowed(player)) {
                    if (item.count > 1) {
                        Entity.setCarriedItem(player, item.id, item.count - 1, item.data, item.extra);
                    } else {
                        Entity.setCarriedItem(player, 0, 0, 0);
                    }
                }
                WorldAPI.playSound(coords.x, coords.y, coords.z, "dig.stone", 1, 0.8);
                preventDefault();
                return;
            }
        } else {
            if (placeFunc) {
                placeFunc(coords, item, block, player, blockSource);
                if (GameAPI.isItemSpendingAllowed(player)) {
                    if (item.count > 1) {
                        Entity.setCarriedItem(player, item.id, item.count - 1, item.data, item.extra);
                    } else {
                        Entity.setCarriedItem(player, 0, 0, 0);
                    }
                }
                WorldAPI.playSound(coords.x, coords.y, coords.z, "dig.stone", 1, 0.8);
                preventDefault();
            }
        }

        ItemRegistry.onItemUsed(coords, item, block, player);

        // for correct behaviour we need to prevent default action if item was removed from hand
        if (Entity.getCarriedItem(player).id == 0) {
            preventDefault();
        }
    }
});
var EntityDataRegistry = {
    isLevelLoaded: false,
    entityData: {},
    entityDataTyped: {},
    getAllData: function() {
        return this.entityData;
    },
    getDataForType: function(type) {
        if (!this.entityDataTyped[type]) {
            this.entityDataTyped[type] = {};
        }
        return this.entityDataTyped[type];
    },
    entityAdded: function(entity) {
        var type = Entity.getEntityTypeId(entity);
        this.entityData[entity] = {
            type: type
        };
        this.getDataForType(type)[entity] = entity;
    },
    entityRemoved: function(entity) {
        var type = Entity.getEntityTypeId(entity);
        delete this.entityData[entity];
        delete this.getDataForType(type)[entity];
    },
    resetEngine: function() {
        this.entityData = {};
        this.entityDataTyped = {};
        this.delayedAddCallbacks = [];
    },
    getData: function(entity) {
        return this.entityData[entity] || {
            type: 0,
            name: "none"
        };
    },
    getType: function(entity) {
        return this.getData(entity).type;
    }
};
Callback.addCallback("EntityAdded", function(entity) {
    EntityDataRegistry.entityAdded(entity);
});
Callback.addCallback("EntityRemoved", function(entity) {
    EntityDataRegistry.entityRemoved(entity);
});
var Particle_addParticle = requireMethodFromNativeAPI("api.NativeAPI", "addParticle");
var Particle_addFarParticle = requireMethodFromNativeAPI("api.NativeAPI", "addFarParticle");
var ParticleAnimator = {
    addParticle: Particle_addParticle,
    addFarParticle: Particle_addFarParticle,
    line: function(particle, coords1, coords2, gap, vel, data) {
        gap = gap || 1;
        var delta = {
            x: coords2.x - coords1.x,
            y: coords2.y - coords1.y,
            z: coords2.z - coords1.z
        };
        vel = vel || {
            x: 0,
            y: 0,
            z: 0
        };
        delta.size = Math.sqrt(delta.x * delta.x + delta.y * delta.y + delta.z * delta.z);
        delta.x /= delta.size;
        delta.y /= delta.size;
        delta.z /= delta.size;
        for (var pos = 0; pos < delta.size; pos += Math.random() * gap * 2) {
            Particle_addFarParticle(particle, coords1.x + delta.x * pos, coords1.y + delta.y * pos, coords1.z + delta.z * pos, vel.x, vel.y, vel.z, data);
        }
    }
};

// ---- DIMENSIONS ----

Dimensions._parsers = {
    error: function(error, descr) {
        throw new TypeError(error + ": " + JSON.stringify(descr));
    },

    getFloat: function(value, default_value) {
        var num = parseFloat(value);
        if (!isNaN(num)) {
            return num;
        }
        return default_value;
    },

    getVec3: function(value, default_value) {
        if (Array.isArray(value)) {
            return {
                x: value[0] || 0,
                y: value[1] || 0,
                z: value[2] || value[0] || 0
            };
        }
        if (typeof(value) == "object") {
            return {
                x: value.x || value.r || 0,
                y: value.y || value.g || 0,
                z: value.z || value.x || value.b || 0
            };
        }
        var num = parseFloat(value);
        if (!isNaN(num)) {
            return {
                x: num,
                y: num,
                z: num
            };
        }
        return default_value;
    },

    getMaterialBlockData: function(value, default_value) {
        if (Array.isArray(value)) {
            return {
                id: parseInt(value[0]) || 0,
                data: parseInt(value[1]) || 0,
                width: parseInt(value[2]) || 1
            };
        }
        if (typeof(value) == "object") {
            return {
                id: parseInt(value.id) || 0,
                data: parseInt(value.data) || 0,
                width: parseInt(value.width) || 1
            };
        }
        var num = parseInt(value);
        if (!isNaN(num)) {
            return {
                id: num,
                data: 0,
                width: 1
            };
        }
        return default_value;
    },

    parseTerrainMaterial: function(material, descr) {
        var base = this.getMaterialBlockData(descr.base, {
            id: 0,
            data: 0
        });
        if (base.id == 0) {
            this.error("TerrainMaterial: base must be defined", descr);
        }
        var cover = this.getMaterialBlockData(descr.cover, {
            id: 0,
            data: 0
        });
        var surface = this.getMaterialBlockData(descr.surface, {
            id: 0,
            data: 0
        });
        var filling = this.getMaterialBlockData(descr.filling, {
            id: 0,
            data: 0
        });
        var diffuse = this.getFloat(descr.diffuse, 0);

        material.setBase(base.id, base.data);
        if (cover.id != 0) {
            material.setCover(cover.id, cover.data);
        }
        if (surface.id != 0) {
            material.setSurface(surface.width, surface.id, surface.data);
        }
        if (filling.id != 0) {
            material.setFilling(filling.width, filling.id, filling.data);
        }
        material.setDiffuse(diffuse);
    },

    newConversion: function(descr) {
        if (descr == "identity") {
            descr = [
                [0, 0],
                [1, 1]
            ];
        } else if (descr == "inverse") {
            descr = [
                [0, 1],
                [1, 0]
            ];
        }
        var conversion = new Dimensions.NoiseConversion();
        for (var i in descr) {
            var node = this.getVec3(descr[i], {
                x: 0,
                y: 0
            });
            conversion.addNode(node.x, node.y);
        }
        return conversion;
    },

    newNoiseOctave: function(descr) {
        var octave = new Dimensions.NoiseOctave(descr.type || "perlin");
        var scale = this.getVec3(descr.scale, {
            x: 1,
            y: 1,
            z: 1
        });
        var translate = this.getVec3(descr.translate, {
            x: 0,
            y: 0,
            z: 0
        });
        var weight = this.getFloat(descr.weight, 1);
        var seed = this.getFloat(descr.seed, 0);
        if (descr.conversion) {
            octave.setConversion(this.newConversion(descr.conversion));
        }
        return octave.setScale(scale.x, scale.y, scale.z).setTranslate(translate.x, translate.y, translate.z).setWeight(weight).setSeed(seed);
    },

    newNoiseLayer: function(descr) {
        if (descr.octaves) {
            var layer = new Dimensions.NoiseLayer();
            if (Array.isArray(descr.octaves)) {
                for (var i in descr.octaves) {
                    layer.addOctave(this.newNoiseOctave(descr.octaves[i]));
                }
            } else {
                var count = this.getFloat(descr.octaves.count);
                if (count <= 0) {
                    this.error("NoiseLayer: octave count is missing or invalid", descr);
                }
                var seed = this.getFloat(descr.octaves.seed, 0);
                var weight = this.getFloat(descr.octaves.weight, 1);
                var weight_factor = this.getFloat(descr.octaves.weight_factor, 2);
                var scale_factor = this.getVec3(descr.octaves.scale_factor, {
                    x: 2,
                    y: 2,
                    z: 2
                });
                var default_scale = 1 << count;
                var scale = this.getVec3(descr.octaves.scale, {
                    x: default_scale,
                    y: default_scale,
                    z: default_scale
                });
                var mul = 2 * ((1 << count) - 1) / (1 << count);
                for (var i = 0; i < count; i++) {
                    layer.addOctave(this.newNoiseOctave({
                        scale: {
                            x: 1 / scale.x,
                            y: 1 / scale.y,
                            z: 1 / scale.z
                        },
                        weight: weight / mul,
                        seed: seed + i
                    }));
                    scale.x /= scale_factor.x;
                    scale.y /= scale_factor.y;
                    scale.z /= scale_factor.z;
                    mul *= weight_factor;
                }
            }
            if (descr.conversion) {
                layer.setConversion(this.newConversion(descr.conversion));
            }
            return layer;
        } else {
            var octave = this.newNoiseOctave(descr);
            var layer = new Dimensions.NoiseLayer();
            layer.addOctave(octave);
            return layer;
        }
    },

    newNoiseGenerator: function(descr) {
        var grid_size = parseInt(this.getFloat(descr.grid, -1));
        var generator = null;
        if (descr.layers) {
            generator = new Dimensions.NoiseGenerator();
            for (var i in descr.layers) {
                generator.addLayer(this.newNoiseLayer(descr.layers[i]));
            }
            if (descr.conversion) {
                generator.setConversion(this.newConversion(descr.conversion));
            }
        } else {
            var layer = this.newNoiseLayer(descr);
            var generator = new Dimensions.NoiseGenerator();
            generator.addLayer(layer);
        }
        if (grid_size > 0) {
            generator.setGridSize(grid_size);
        }
        return generator;
    },

    newTerrainLayer: function(descr, factory) {
        var minY = this.getFloat(descr.minY, -1);
        var maxY = this.getFloat(descr.maxY, -1);
        if (minY == -1 || maxY == -1) {
            this.error("TerrainLayer: no minY or maxY specified", descr);
        }
        minY = parseInt(minY);
        maxY = parseInt(maxY);
        if (minY < 0 || maxY > 256 || minY >= maxY) {
            this.error("TerrainLayer: invalid range " + minY + " " + maxY, descr);
        }
        var layer = factory(minY, maxY);
        if (descr.noise) {
            layer.setMainNoise(this.newNoiseGenerator(descr.noise));
        }
        if (descr.heightmap) {
            layer.setHeightmapNoise(this.newNoiseGenerator(descr.heightmap));
        }
        if (descr.yConversion) {
            layer.setYConversion(this.newConversion(descr.yConversion));
        }
        this.parseTerrainMaterial(layer.getMainMaterial(), descr.material);
        if (descr.materials) {
            for (var i in descr.materials) {
                var material = descr.materials[i];
                if (!material.noise) {
                    this.error("TerrainLayer: material missing noise", material);
                }
                this.parseTerrainMaterial(layer.addNewMaterial(this.newNoiseGenerator(material.noise), 0), material);
            }
        }
        return layer;
    },

    newTerrainLayerSet: function(descr, factory) {
        var layers = descr.layers;
        if (layers) {
            var result = [];
            for (var i in layers) {
                result.push(this.newTerrainLayer(layers[i], factory));
            }
            return result;
        } else {
            this.error("field 'layers' not found in layer set description", descr);
        }
    },

    newMonoBiomeTerrainGenerator: function(descr) {
        var generator = new Dimensions.MonoBiomeTerrainGenerator();
        this.newTerrainLayerSet(descr, function(minY, maxY) {
            return generator.addTerrainLayer(minY, maxY);
        });
        if (descr.biome) {
            generator.setBaseBiome(this.getFloat(descr.biome));
        }
        return generator;
    },

    newGenerator: function(descr) {
        var generator = new Dimensions.CustomGenerator(descr.base || "overworld");
        if (descr.buildVanillaSurfaces != undefined) {
            generator.setBuildVanillaSurfaces(descr.buildVanillaSurfaces);
        }
        if (descr.generateVanillaStructures != undefined) {
            generator.setGenerateVanillaStructures(descr.generateVanillaStructures);
        }
        if (descr.modWorldgenDimension != undefined) {
            var dimensionMap = {
                "overworld": 0,
                "nether": 1,
                "end": 2
            }
            var id = descr.modWorldgenDimension;
            if (id in dimensionMap) {
                id = dimensionMap[id];
            }
            generator.setModGenerationBaseDimension(id);
        }

        descr.type = descr.type || "mono";
        switch (descr.type) {
            case "mono":
                generator.setTerrainGenerator(this.newMonoBiomeTerrainGenerator(descr));
                return generator;
        }
        this.error("invalid generator type: " + descr.type, descr);
    }
};

Dimensions.newGenerator = function(description) {
    return Dimensions._parsers.newGenerator(description);
}


// --------------------

var Resources = {
    addRuntimePack: function(type, name) {
        return MCSystem.addRuntimePack(type, name);
    }
};


// --------------------

Translation.addTranslation("Workbench", {
    ru: "\u0412\u0435\u0440\u0441\u0442\u0430\u043a"
});
Translation.addTranslation("off", {
    ru: "\u0412\u044b\u043a\u043b"
});
Translation.addTranslation("on", {
    ru: "\u0412\u043a\u043b"
});
Translation.addTranslation("yes", {
    ru: "\u0414\u0430"
});
Translation.addTranslation("no", {
    ru: "\u041d\u0435\u0442"
});
Translation.addTranslation("mb", {
    ru: "\u043c\u0412"
});
Translation.addTranslation("system.thread_stopped", {
    en: "All mods are stopped because of\nfatal error on main thread.\nPlease re-enter the world.",
    ru: "."
});

var CoreAPI = {
    getCoreAPILevel: function() {
        return CORE_ENGINE_API_LEVEL;
    },
    runOnMainThread: function(func) {
        MCSystem.runOnMainThread({
            run: func
        });
    },
    getMCPEVersion: getMCPEVersion,
    Debug: {
        sysTime: function() {
            return java.lang.System.currentTimeMillis();
        },
        addParticle: function(id, x, y, z, vx, vy, vz, data) {
            Level.addParticle(id, x, y, z, vx, vy, vz, data);
        },
        message: function(message) {
            clientMessage(ChatColor.GREEN + "DEBUG: " + new String(message));
        },
        warning: function(message) {
            clientMessage(ChatColor.GOLD + "WARNING: " + new String(message));
        },
        error: function(message) {
            clientMessage(ChatColor.RED + "ERROR: " + new String(message));
        },
        m: function() {
            var messages = [];
            for (var i in arguments) {
                var obj = arguments[i];
                if (typeof(obj) == "object") {
                    try {
                        messages.push(JSON.stringify(obj));
                    } catch (e) {
                        messages.push("" + obj);
                    }
                } else {
                    messages.push("" + obj);
                }
            }
            this.message(messages.join(", "));
        },
        bitmap: function(bitmap, title) {
            GuiUtils.Run(function() {
                var ctx = getMcContext();
                var builder = android.app.AlertDialog.Builder(ctx);
                if (title) {
                    builder.setTitle(title + "");
                }
                var imgView = new android.widget.ImageView(ctx);
                imgView.setImageBitmap(bitmap);
                builder.setView(imgView);
                builder.show();
            });
        },
        big: function() {
            var messages = [];
            for (var i in arguments) {
                var obj = arguments[i];
                if (typeof(obj) == "object") {
                    try {
                        messages.push(JSON.stringify(obj, null, "  "));
                    } catch (e) {
                        messages.push("" + obj);
                    }
                } else {
                    messages.push("" + obj);
                }
            }
            GuiUtils.Run(function() {
                var ctx = getMcContext();
                var builder = android.app.AlertDialog.Builder(ctx);
                var textView = new android.widget.TextView(ctx);
                textView.setText(messages.join("\n\n"));
                textView.setTextIsSelectable(true);
                builder.setTitle("Debug.big");
                builder.setView(textView);
                builder.show();

            });
        }
    },

    Network: Network,
    NetworkEntity: NetworkEntity,
    NetworkEntityType: NetworkEntityType,
    NetworkConnectedClientList: NetworkConnectedClientList,
    SyncedNetworkData: SyncedNetworkData,
    BlockSource: BlockSource,
    PlayerActor: PlayerActor,
    ItemContainer: ItemContainer,

    NBT: NBT,
    TagRegistry: TagRegistry,
    Resources: Resources,
    Dimensions: Dimensions,
    CustomBiome: CustomBiome,
    Commands: Commands,
    FileTools: FileTools,
    Logger: Logger,
    Translation: Translation,
    Threading: Threading,
    Config: Config,
    UI: UI,
    UpdatableAPI: Updatable,
    Updatable: Updatable,
    TileEntity: TileEntity,
    MobRegistry: MobRegistry,
    MobSpawnRegistry: EntitySpawnRegistry,
    Callback: Callback,
    GameObject: GameObject,
    GameObjectRegistry: GameObjectRegistry,
    ModAPI: ModAPI,
    Saver: SaverAPI,
    World: WorldAPI,
    Entity: EntityAPI,
    AddonEntityRegistry: AddonEntityRegistry,
    Player: PlayerAPI,
    Game: GameAPI,
    Render: RenderAPI,
    Texture: Texture,
    EntityModel: ModelAPI,
    EntityModelWatcher: ModelWatcher,
    EntityAIClass: EntityAI,
    EntityAIWatcher: EntityAIWatcher,
    EntityAI: {
        Idle: EntityAIIdle,
        Follow: EntityAIFollow,
        Panic: EntityAIPanic,
        Wander: EntityAIWander,
        Attack: EntityAIAttack,
        Swim: EntityAISwim,
        PanicWatcher: EntityAIPanicWatcher
    },
    GenerationUtils: WorldGenerationUtils,
    Animation: {
        base: AnimationBase,
        Base: AnimationBase,
        item: AnimationItem,
        Item: AnimationItem
    },
    Particles: ParticleAnimator,
    IDRegistry: IDRegistry,
    IDData: {
        item: ItemID,
        block: BlockID
    },
    ItemID: ItemID,
    BlockID: BlockID,
    Block: BlockRegistry,
    ItemModel: ItemModel,
    BlockRenderer: BlockRenderer,
    ICRender: ICRender,
    Item: ItemRegistry,
    Recipes: Recipes,
    ToolAPI: ToolAPI,
    Armor: ArmorRegistry,
    LiquidRegistry: LiquidRegistry,
    Native: {
        ArmorType: ArmorType,
        ItemCategory: ItemCategory,
        ParticleType: ParticleType,
        Color: ChatColor,
        EntityType: EntityType,
        MobRenderType: EntityRenderType,
        PotionEffect: MobEffect,
        Dimension: DimensionId,
        ItemAnimation: UseAnimation,
        BlockSide: BlockFace,
        Enchantment: Enchantment,
        EnchantType: EnchantType,
        BlockRenderLayer: BlockRenderLayer,
        GameMode: GameMode,
        GameDifficulty: GameDifficulty,
        PlayerAbility: PlayerAbility,
        TileEntityType: TileEntityType,
        NbtDataType: NbtDataType
    },
    alert: print
};

function ResetInGameAPIs() {
    TileEntity.resetEngine();
    ToolAPI.resetEngine();
    EntityDataRegistry.resetEngine();
    WorldGeneration.resetEngine();
    GameObjectRegistry.resetEngine();
}

function injectCoreAPI(scope) {
    for (var name in CoreAPI) {
        scope[name] = CoreAPI[name];
    }
}
