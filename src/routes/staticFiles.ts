import express from 'express';
import path from 'path';

const setupStaticFiles = (app) => {
  app.use('/public', express.static(path.join(__dirname, './public')));
  app.use('/static', express.static(path.join(__dirname, '../static')));
  app.use(
    '/datagouvfr',
    express.static(
      path.join(
        __dirname,
        process.env.NODE_ENV === 'production' ? '../..' : '..',
        'node_modules/template.data.gouv.fr/dist'
      )
    )
  ); // hack to mimick the behavior of webpack css-loader (used to import template.data.gouv.fr)
  app.use(
    '/react-datepicker/react-datepicker.css',
    express.static(
      path.join(
        __dirname,
        process.env.NODE_ENV === 'production' ? '../..' : '..',
        'node_modules/react-datepicker/dist/react-datepicker.css'
      )
    )
  );
  app.use(
    '/react-tabulator/styles.css',
    express.static(
      path.join(
        __dirname,
        process.env.NODE_ENV === 'production' ? '../..' : '..',
        'node_modules/react-tabulator/lib/styles.css'
      )
    )
  );
  app.use(
    '/react-tabulator/tabulator.min.css',
    express.static(
      path.join(
        __dirname,
        process.env.NODE_ENV === 'production' ? '../..' : '..',
        'node_modules/react-tabulator/lib/css/tabulator.min.css'
      )
    )
  );
  app.use(
    '/react-markdown-editor-lite/index.css',
    express.static(
      path.join(
        __dirname,
        process.env.NODE_ENV === 'production' ? '../..' : '..',
        'node_modules/react-markdown-editor-lite/lib/index.css'
      )
    )
  );
  app.use(
    '/topbar.js',
    express.static(
      path.join(
        __dirname,
        process.env.NODE_ENV === 'production' ? '../..' : '..',
        'node_modules/topbar/topbar.min.js'
      )
    )
  );
  // ... autres configurations de fichiers statiques
};

export default setupStaticFiles;
