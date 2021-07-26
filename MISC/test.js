class CuboidMakerTwo {
  constructor( prop ) {
    this.length = prop.length;
    this.width = prop.width;
    this.height = prop.height;
  }

  volume() {
    return this.length * this.width * this.height;
  }

  surfaceArea() {
    return 2 * ( ( this.length * this.width ) + ( this.length * this.height ) + ( this.width * this.height ) );
  }
}


let cuboidTwo = new CuboidMakerTwo( {
  length: 4,
  width: 5,
  height: 5
} );

//🦄🦄🦄 Test your volume and surfaceArea methods by uncommenting the logs below: 🦄🦄🦄
console.log( cuboidTwo.volume() ); // 100
console.log( cuboidTwo.surfaceArea() ); // 130
