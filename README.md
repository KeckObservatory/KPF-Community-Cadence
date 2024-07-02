# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default {
  // other rules...
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
}
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list

## Release
For releases, do the steps for www3 release:

navigate to 

```wwwbuild/observers/kpf-cc/```

clone repo and name it with the following line

```git clone https://git@github.com/KeckObservatory/Kpf-Community-Cadence.git X.X.X && cd X.X.X```

where X.X.X is the version you wish to release. 

Copy license.json from previous versions with

```cp ../X.X.X-1/src/license.json ./src/license.json```

where ```X.X.X-1``` is the previous version released. 

Install dependencies and build with the followoing line

```npm install && npm run build```

To make to run the following

```make install```

Verify/test the version deployed at 

[https://www3build.keck.hawaii.edu/observers/kpf-cc/rel/index.html](https://www3build.keck.hawaii.edu/observers/kpf-cc/rel/index.html).

If ready to deploy run

```kdeploy -a www/observers/kpf-cc```

Check that the ref is set to the correct version before deploying.

Navigate to 

[https://www3.keck.hawaii.edu/observers/kpf-cc/rel/index.html](https://www3.keck.hawaii.edu/observers/kpf-cc/rel/index.html).
