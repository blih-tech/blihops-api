import 'dotenv/config';
import { env } from './shared/configs/env.js';
import { app } from './app.js';

const port = env.PORT;

app.listen(port, () => {
  console.log(
    `blihops-api listening on port ${port}, in ${env.NODE_ENV} mode (http://localhost:${port}/health)`,
  );
});
