import pkg_info from "./package.json";

export default (config, env, helpers) => {
    config.output.publicPath = pkg_info.publicPath;

    config.plugins.push(
        new helpers.webpack.DefinePlugin({
            'process.env.PUBLIC_PATH': JSON.stringify(config.output.publicPath || './')
        })
    );
};