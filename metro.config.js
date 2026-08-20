const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// @supabase/supabase-js ESM usa import(OTEL_PKG), inválido no Hermes (release Android).
// O bundle CJS usa require() e compila corretamente.
const supabaseCjs = path.resolve(
  __dirname,
  "node_modules/@supabase/supabase-js/dist/index.cjs"
);

// @supabase/realtime-js → @supabase/phoenix; Metro não resolve "main" com extensão .cjs.js
const phoenixCjs = path.resolve(
  __dirname,
  "node_modules/@supabase/phoenix/priv/static/phoenix.cjs.js"
);

const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "@supabase/supabase-js") {
    return { type: "sourceFile", filePath: supabaseCjs };
  }
  if (moduleName === "@supabase/phoenix") {
    return { type: "sourceFile", filePath: phoenixCjs };
  }
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
