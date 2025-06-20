import chalk from 'chalk';
import { deal } from '../libs/plugin/deal';

const command = async (args) => {

  console.log(chalk.bgGreenBright("args"), args);
  
  if(!args.solutionid) {
    console.log(chalk.bgRedBright('Not specify --solutionid'));
  } else {
    console.log(chalk.bgCyanBright(`SolutionId: ${args.solutionid}`));
  }
  await deal(args.solutionid);
};

export { command };
