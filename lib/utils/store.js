/**
 * Created by ym on 2017/3/7.
 */
var fs = require('fs');
var path = require('path');

/**
 * 对JSON对象数据进行文件的操作处理工具类
 * @param fileName
 * @returns {HyMuiStore}
 * @constructor
 */

function HyMuiStore(fileName) {
    this.data = {};

    if (!fileName) return this;

    this.fileName = fileName;
    if (fileName.indexOf('.') < 0) {
        this.fileName += '.data';
    }

    this.homeDir = process.env.HOME || process.env.USERPROFILE || process.env.HOMEPATH;

    this.privateDir = path.join(this.homeDir, '.HyMui');

    if (!fs.existsSync(this.privateDir)) {
        fs.mkdirSync(this.privateDir);
    }

    this.filePath = path.join(this.privateDir, this.fileName);

    try {
        this.data = JSON.parse(fs.readFileSync(this.filePath));
    } catch (e) {}

    return this;
}
/**
 * 获取key值对应的值
 * @param k 属性值
 * @returns {*}
 */
HyMuiStore.prototype.get = function(k) {
    if (k) {
        return this.data[k];
    }
    return this.data;
};
/**
 * 设置key值对应的value值
 * @param k 属性值
 * @param v 值
 */
HyMuiStore.prototype.set = function(k, v) {
    this.data[k] = v;
};
/**
 * 移除key属性
 * @param k 属性值
 */
HyMuiStore.prototype.remove = function(k) {
    delete this.data[k];
};
/**
 * 保存数据到文件系统
 */
HyMuiStore.prototype.save = function() {
    try {
        var dataStoredAsString = JSON.stringify(this.data, null, 2);
        fs.writeFileSync(this.filePath, dataStoredAsString);
        this.data = JSON.parse(dataStoredAsString);
    } catch (e) {
        console.error('Unable to save HyMui data:', this.filePath, e);
    }
};

module.exports = HyMuiStore;
