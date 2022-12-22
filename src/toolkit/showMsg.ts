import { notification } from 'antd';

export class ShowMsg {
  duration: number | null | undefined;

  constructor(duration: number | null | undefined) {
    this.duration = duration;
  }

  Info(desc: string) {
    console.log(`Info: ${desc}`);
    notification.info({
      message: 'Info',
      description: desc,
      duration: this.duration,
    });
  }

  Error(desc: string) {
    console.log(`Error: ${desc}`);
    notification.error({
      message: 'Error',
      description: desc,
      duration: this.duration,
    });
  }
}
