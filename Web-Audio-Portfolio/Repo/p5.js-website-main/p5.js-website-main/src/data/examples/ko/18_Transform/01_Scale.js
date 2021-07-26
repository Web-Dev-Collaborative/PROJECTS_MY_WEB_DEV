/*
 * @name 크기 조정(Scale)
 * @description scale()함수의 매개변수는 10진수 백분율로 표현됩니다.
 * 예를 들어, scale(2.0) 메소드 호출은 도형의 차원을 200 퍼센트 증가시킵니다.
 * 오브젝트의 크기는 항상 원점을 기준으로 조정됩니다. 
 * 이 예제는 그러한 변형이 누적되는 양상과, 순서에 따라 scale과 translate이
 * 상호작용하는 것을 보여줍니다.
 */

let a = 0.0;
let s = 0.0;

function setup() {
  createCanvas(720, 400);
  noStroke();
  // 드로잉 시작 기본 위치인 상단 좌측 코너가 아닌,
  // 화면 중앙에서 직사각형이 그려지도록 합니다.
  rectMode(CENTER);
}

function draw() {
  background(102);

  // 'a'를 천천히 증가시킨 다음 'a'의 코사인을 찾아,
  // 's'에 부드럽고 주기적인 애니메이션 효과를 줍니다.
  a = a + 0.04;
  s = cos(a) * 2;

  // 사각형의 위치를 원점에서 캔버스 중간으로 이동(translate)한 다음,
  // 's'로 크기를 조정합니다.
  translate(width / 2, height / 2);
  scale(s);
  fill(51);
  rect(0, 0, 50, 50);

  // 위치 이동과 크기 조정은 누적됩니다.
  // 따라서 이동된 두 번째 사각형은 첫 번째 사각형보다 
  // 조금 더 오른쪽으로 이동하게 되고, 그 크기는 두배가 됩니다.
  // 한편, 코사인은 's'가 음수와 양수를 오가도록 하는데,
  // 이에 따라 사각형이 왼쪽과 오른쪽을 순환하게 됩니다.
  translate(75, 0);
  fill(255);
  scale(s);
  rect(0, 0, 50, 50);
}
