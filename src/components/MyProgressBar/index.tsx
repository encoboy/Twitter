import { Progress, ProgressProps } from 'antd';

export interface MyProgressBarProps {
  progressProps?: ProgressProps;
  text?: string;
}

export const MyProgressBar: React.FC<MyProgressBarProps> = (props) => {
  return (
    <div>
      <Progress {...props.progressProps} />
      <p>{props.text}</p>
    </div>
  );
};
