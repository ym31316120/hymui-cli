import {BuildContext} from './util/interfaces';
import {BuildError} from './util/error';
import {webpack} from './webpack';


export function bundle(context: BuildContext, configFile?: string) {
    return bundleWorker(context, configFile)
        .catch((err: Error) => {
            throw new BuildError(err);
        });
}

function bundleWorker(context: BuildContext, configFile: string) {
    return webpack(context, configFile);
}
