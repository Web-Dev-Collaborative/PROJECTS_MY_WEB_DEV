/*
 * @name 조건문 1
 * @description 조건문은 마치 질문과도 같습니다.
 * 프로그램은 조건문이 던지는 질문이 참인지 거짓인지에 따라
 * 특정 선언문의 실행 여부를 결정합니다.
 * 조건문으로 던지는 질문들은 언제나 논리 또는 관계 선언문의 형식을 갖습니다.
 * 이 예제의 경우, 변수 i가 0이라는 조건이 충족될시 선이 그려집니다.
 */
function setup() {
  createCanvas(720, 360);
  background(0);

  for (let i = 10; i < width; i += 10) {
    // i가 20으로 나누어 떨어진다면, 첫번째 선을 그린다.
    // 그렇지 않을 경우, 두번째 선을 그린다.
    if (i % 20 === 0) {
      stroke(255);
      line(i, 80, i, height / 2);
    } else {
      stroke(153);
      line(i, 20, i, 180);
    }
  }
}
