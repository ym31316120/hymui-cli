import * as fs from 'fs-extra';
import * as clean from './clean';

describe('clean task', () => {

    describe('clean', () => {
        it('build目录应该是空的', () => {

            spyOn(fs, fs.emptyDirSync.name).and.returnValue('things');
            const context = {buildDir: 'something'};

            // 案例
            return clean.clean(context).then(() => {
                expect(fs.emptyDirSync).toHaveBeenCalledWith(context.buildDir);
            });
        });

        it('当清空目录失败时应该抛出异常', () => {
            spyOn(fs, fs.emptyDirSync.name).and.throwError('Simulating an error');
            const context = {buildDir: 'something'};

            return clean.clean(context).catch((ex) => {
                expect(ex instanceof Error).toBe(true);
                expect(typeof ex.message).toBe('string');
            });
        });
    });
});
