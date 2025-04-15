import chalk from 'chalk';
import { deal } from '../libs/webresource/deal';

const command = async (args) => {

  console.log(chalk.bgGreenBright("args"), args);
  
  if (args['_'].length < 2 || !args.solution) {
    console.log(chalk.redBright('必须传入filepath --solution <solution>!'));
    return;
  }
  const [_, filepath] = args['_'];
  const solution = args.solution;
  console.log(`filepath: ${filepath}, solution: ${solution}`);
  await deal(filepath, solution);
};

export { command };
