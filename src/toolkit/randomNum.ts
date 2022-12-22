//生成从minNum到maxNum的随机数
export default function randomNum(minNum = 0, maxNum = 9) {
  return (Math.random() * (maxNum - minNum + 1) + minNum) >> 0;
}
