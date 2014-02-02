

export class Pool<T>
{
	private pool:any[];
	private counter:number;

	constructor( type:any, len:number )
	{
		this.pool = [];
		this.counter = len;

		var i:number = len;
		while(--i > -1)
			this.pool[i] = new type();

		return this;
	}
	public pop():T
	{
		if( this.counter > 0)
			return this.pool[--this.counter];
		else
			throw new Error("You exhausted the pool!");
	}

	public push(s:T):void
	{
		this.pool[this.counter++] = s;
	}
}

export class TestPoolClass
{
	constructor(){}
	juan(){}
}


var pool:Pool<TestPoolClass> = new Pool(TestPoolClass,100);
pool.pop().juan();
//pepePool.pop().someMethod();