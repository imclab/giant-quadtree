;module.exports = (function(){
var __m1 = function(module,exports){module.exports=exports;
module.exports = Node;

function Node(left, top, width, height, parent){
	this.objects = [];

	this.left = left;
	this.top = top;
	this.width = width;
	this.height = height;
	this.right = this.left + this.width;
	this.bottom = this.top + this.height;
	this.isBase = (this.width / 2) < this.minimumSize;

	this.parent = parent;
}

Node.prototype.tl = void 0;
Node.prototype.tr = void 0;
Node.prototype.br = void 0;
Node.prototype.bl = void 0;

Node.prototype.objectLimit = 200;
Node.prototype.minimumSize = 3000;

Node.prototype.clear = function(){
	this.objects = [];

	if(this.tl){
		this.tl.clear();
		this.tr.clear();
		this.br.clear();
		this.bl.clear();
	}
};

Node.prototype.getObjects = function(){
	if(this.tl){
		return this.objects.concat(this.tl.getObjects(), this.tr.getObjects(), this.br.getObjects(), this.bl.getObjects());
	} else {
		return this.objects.slice();
	}
};

Node.prototype.split = function(){
	var childWidth = this.width / 2,
		childHeight = this.height / 2,
		left = this.left,
		top = this.top;

	this.tl = new Node(left, top, childWidth, childHeight, this);
	this.tr = new Node(left + childWidth, top, childWidth, childHeight, this);
	this.br = new Node(left + childWidth, top + childHeight, childWidth, childHeight, this);
	this.bl = new Node(left, top + childHeight, childWidth, childHeight, this);
};

// This can be called from ANY node in the tree, it'll return the top most node of the tree
// that can contain the element (it will grow the tree if nescessary)
Node.prototype.parentNode = function(obj){
	var node = this,
		parent;

	// If object is left of this node
	if(obj.left < node.left){
		// If object is to the top of this node
		if(obj.top < node.top){
			// Grow towards top left
			parent = node.grow(node.width, node.height);
		} else {
			// Grow towards bottom left
			parent = node.grow(node.width, 0);
		}
	// If object is right of this node
	} else if(obj.left + obj.width > node.left + node.width){
		// If object is to the top of this node
		if(obj.top < node.top){
			// Grow towards top right
			parent = node.grow(0, node.height);
		} else {
			// Grow towards bottom right
			parent = node.grow(0, 0);
		} 

	// If object is within x-axis but top of node
	} else if(obj.top < node.top){
		// Grow towards top right (top left is just as valid though)
		parent = node.grow(0, node.height);
	// If object is within x-axis but bottom of node
	} else if(obj.top + obj.height > node.top + node.height){
		// Grow towards bottom right (bottom left is just as valid though)
		parent = node.grow(0, 0);
	}
	
	// If we had to grow, find the quadrant in the parent
	if(parent){
		return parent.parentNode(obj);
	}

	return node;
};

// Helper function which gets the quadrant node at a given x/y position
// caller function has to check to see if this node is split before calling this
Node.prototype.getQuadrantAt = function(x, y){
	if(!this.tl) return this;

	var xMid = this.left + this.width / 2,
		yMid = this.top + this.height / 2;

	if(x < xMid){
		if(y < yMid){
			return this.tl.tl && this.tl.getQuadrantAt(x, y) || this.tl;
		} else {
			return this.bl.tl && this.bl.getQuadrantAt(x, y) || this.bl;
		}
	} else {
		if(y < yMid){
			return this.tr.tl && this.tr.getQuadrantAt(x, y) || this.tr;
		} else {
			return this.br.tl && this.br.getQuadrantAt(x, y) || this.br;
		}
	}
};

// Gets all the objects in quadrants within the given dimensions. 
// This assumes that the given dimensions can't be larger than a quadrant, 
// meaning it can at most touch 4 quadrants
Node.prototype.getInteractableObjects = function(left, top, width, height){
	if(!this.tl) return this.objects.slice();	

	var node = this.getQuadrant(left, top, width, height),
		objectsList = [node.objects],
		quadrants = [node], // Keeps track to prevent dupes
		parent = node.parent;

	while(parent){
		objectsList.push(parent.objects);
		quadrants.push(parent);
		parent = parent.parent;
	}

	if(node.tl){
		// top left corner
		var quadrant = node.getQuadrantAt(left, top);
		if(!~quadrants.indexOf(quadrant)){
			quadrants.push(quadrant);
			objectsList.push(quadrant.objects);

			if(quadrant.parent && !~quadrants.indexOf(quadrant.parent)){
				quadrants.push(quadrant.parent);
				objectsList.push(quadrant.parent.objects);	
			}
		}
		
		// top right corner
		quadrant = node.getQuadrantAt(left + width, top);
		if(!~quadrants.indexOf(quadrant)){
			quadrants.push(quadrant);
			objectsList.push(quadrant.objects);

			if(quadrant.parent && !~quadrants.indexOf(quadrant.parent)){
				quadrants.push(quadrant.parent);
				objectsList.push(quadrant.parent.objects);	
			}
		}

		// bottom right corner
		quadrant = node.getQuadrantAt(left + width, top + height);
		if(!~quadrants.indexOf(quadrant)){
			quadrants.push(quadrant);
			objectsList.push(quadrant.objects);

			if(quadrant.parent && !~quadrants.indexOf(quadrant.parent)){
				quadrants.push(quadrant.parent);
				objectsList.push(quadrant.parent.objects);	
			}
		}

		// bottom left corner
		quadrant = node.getQuadrantAt(left, top + height);
		if(!~quadrants.indexOf(quadrant)){
			quadrants.push(quadrant);
			objectsList.push(quadrant.objects);
			if(quadrant.parent && !~quadrants.indexOf(quadrant.parent)) objectsList.push(quadrant.parent.objects);
		}
	}

	return Array.prototype.concat.apply([], objectsList);
};

// Gets the quadrant a given bounding box dimensions would be inserted into
Node.prototype.getQuadrant = function(left, top, width, height){
	if(!this.tl) return this;

	var	xMid = this.left + this.width / 2,
		yMid = this.top + this.height / 2,
		topQuadrant = (top < yMid) && ((top + height) < yMid),
		bottomQuadrand = top > yMid;

	if((left < xMid) && ((left + width) < xMid)){
		if(topQuadrant){
			return this.tl.tl && this.tl.getQuadrant(left, top, width, height) || this.tl;
		} else if(bottomQuadrand){
			return this.bl.tl && this.bl.getQuadrant(left, top, width, height) || this.bl;
		}
	} else if(left > xMid){
		if(topQuadrant){
			return this.tr.tl && this.tr.getQuadrant(left, top, width, height) || this.tr;
		} else if(bottomQuadrand) {
			return this.br.tl && this.br.getQuadrant(left, top, width, height) || this.br;
		}
	}

	return this;
};

// Inserts the object to the Node, spliting or growing the tree if nescessary
// Returns the top-most node of this tree
Node.prototype.insert = function(obj){
	var quadrant,
		index,
		length,
		remainingObjects,
		objects,
		node;

	// This call will grow the tree if nescessary and return the parent node
	// if the tree doesn't need to grow, `node` will be `this`.
	node = this.parentNode(obj);
	quadrant = node.getQuadrant(obj.left, obj.top, obj.width, obj.height);

	if(quadrant !== node){
		quadrant.insert(obj);
	} else {
		objects = node.objects;
		objects.push(obj);

		index = 0;
		length = objects.length;
		if(!this.isBase && length > node.objectLimit){
			// Split if not already split
			if(!node.tl) node.split();

			// For objects that don't fit to quadrants
			remainingObjects = [];
		
			// Iterate through all object and try to put them in a
			// Quadrant node, if that doesn't work, retain them	
			for(; index < length; index++){

				// Reusing the obj var
				obj = node.objects[index];
				quadrant = node.getQuadrant(obj.left, obj.top, obj.width, obj.height);
				if(quadrant !== node){
					quadrant.insert(obj);
				} else {
					remainingObjects.push(obj);
				}
			}

			node.objects = remainingObjects;
		}
	}

	return node;
};

// Creates a pre-split parent Node and attaches this Node as a
// node at the given x/y offset (so 0,0 would make this Node the top left node)
Node.prototype.grow = function(xOffset, yOffset){
	var left = this.left - xOffset,
		top = this.top - yOffset,
		parent = new Node(left, top, this.width * 2, this.height * 2);
	
	this.parent = parent;

	if(xOffset){
		if(yOffset){
			parent.br = this;
		} else {
			parent.tr = this;
		}
	} else if(yOffset) {
		parent.bl = this;
	} else {
		parent.tl = this;
	}

	parent.tl = parent.tl || new Node(left, top, this.width, this.height, this);
	parent.tr = parent.tr || new Node(left + this.width, top, this.width, this.height, this);
	parent.br = parent.br || new Node(left + this.width, top + this.height, this.width, this.height, this);
	parent.bl = parent.bl || new Node(left, top + this.height, this.width, this.height, this);

	return parent;
};


;return module.exports;}({},{});
var __m0 = function(module,exports){module.exports=exports;
var Node = __m1;

/* Quadtree by Ozan Turgut (ozanturgut@gmail.com)

   A Quadtree is a structure for managing many nodes interacting in space by
   organizing them within a tree, where each node contains elements which may
   interact with other elements within the node. This is particularly useful in
   collision detection, in which a brute-force algorithm requires the checking of
   every element against every other element, regardless of their distance in space.

   This quadtree handles object in 2d space by their bounding boxes. It splits
   a node once it exceeds the object limit per-node. When a node is split, it's
   contents are divied up in to 4 smaller nodes to fulfill the per-node object limit.
   Nodes are infinitely divisible.

   If an object is inserted which exceeds the bounds of this quadtree, the quadtree
   will grow in the direction the object was inserted in order to encapsulate it. This is
   similar to a node split, except in this case we create a parent node and assign the existing
   quadtree as a quadrant within it. This allows the quadtree to contain any object, regardless of
   its position in space.

   One function is exported which creates a quadtree given a width and height.

   The quadtree api has two methods:

   insert(bounds)
   		Inserts a bounding box (it should contain an left, top, width, and height property).

   	retrieve(bounds)
   		Retrieves a list of bounding boxes that share a node with the given bounds object.
*/

var Quadtree = module.exports = function(width, height){
	if(width){
		this.width = width;
		this.height = height? height : width;
	}
	window.q = this;
	
	this.reset();
};

Quadtree.create = function(width, height){
	var quadtree = new Quadtree(width, height);
	return Quadtree.getApi(quadtree);
};

Quadtree.getApi = function(quadtree){
	var api = {};
	api.insert = quadtree.insert.bind(quadtree);
	api.reset = quadtree.reset.bind(quadtree);
	api.getObjects = quadtree.getObjects.bind(quadtree);
	api.prune = quadtree.prune.bind(quadtree);

	return api;
};

Quadtree.prototype.width = 10000;
Quadtree.prototype.height = 10000;

Quadtree.prototype.reset = function(x, y){
	x = x || 0;
	y = y || 0;

	var negHalfWidth = -(this.width / 2);
	var negHalfHeight = -(this.height / 2);
	this.top = new Node(x, y, this.width, this.height);
//	this.top = new Node(x + negHalfWidth, y + negHalfHeight, this.width, this.height);
};

Quadtree.prototype.insert = function(obj){
	this.top = this.top.insert(obj);
};

function isInNode(node, left, top, right, bottom){
	return node.left <= left && node.top <= top && node.right >= right && node.bottom >= bottom;
};

function getContainingNodeHelper(left, top, right, bottom, node){
	if(!node.tl) return node;

	if(left < node.tr.left){
		if(right < node.tr.left){
			if(bottom < node.bl.top){
				return getContainingNodeHelper(left, top, right, bottom, node.tl);
			} else if(top > node.bl.top) {
				return getContainingNodeHelper(left, top, right, bottom, node.bl);
			}
		}
	} else {
		if(bottom < node.br.top){
			return getContainingNodeHelper(left, top, right, bottom, node.tr);
		} else if(top > node.br.top) {
			return getContainingNodeHelper(left, top, right, bottom, node.br);
		}
	}

	return node;
}

Quadtree.prototype.getContainingNode = function(left, top, right, bottom, node){
	if(left < this.top.left || 
		top < this.top.top || 
		right > this.top.right || 
		bottom > this.top.bottom){
		return;	
	}

	return getContainingNodeHelper(left, top, right, bottom, this.top);
/*
	node = node || this.top;
	if(!node.tl) return node;

	// If area fits in any node, recurse down the tree
	if(isInNode(node.tl, left, top, right, bottom)){
		return this.getContainingNode(left, top, right, bottom, node.tl);
	} else if(isInNode(node.tr, left, top, right, bottom)){
		return this.getContainingNode(left, top, right, bottom, node.tr);
	} else if(isInNode(node.bl, left, top, right, bottom)){
		return this.getContainingNode(left, top, right, bottom, node.bl);
	} else if(isInNode(node.br, left, top, right, bottom)){
		return this.getContainingNode(left, top, right, bottom, node.br);
	} else if(isInNode(node, left, top, right, bottom)){
		return node;
	}*/
};

Quadtree.prototype.minimumSize = 3000;
Quadtree.prototype.getInteractableObjects = function(left, top, right, bottom){
	var self = this,
		minimumSize = this.minimumSize,
		tl = this.getContainingNode(left, top, left + 1, top + 1),
		tr,
		bl,
		br,
		objectsList = tl ? [tl.getObjects()] : [],
		ancestor;

	function addAncestorElements(left, top, right, bottom){
		var ancestor = self.getContainingNode(left, top, right, bottom);
		if(ancestor && !~objectsList.indexOf(ancestor.objects)) objectsList.push(ancestor.objects);
	}

	if(!tl || tl.right < right){
		tr = this.getContainingNode(right - 1, top, right, top + 1);
		if(tr) objectsList.push(tr.getObjects());
		else tr = tl;
	} else {
		tr = tl;
	}

	if(!tl || tl.bottom < bottom){
		bl = this.getContainingNode(left, bottom - 1, left + 1, bottom);
		if(bl) objectsList.push(bl.getObjects());
		else bl = tl;
	} else {
		bl = tl;
	}

	if(!tr || tr.bottom < bottom){
		if(!bl || bl.right < right){
			br = this.getContainingNode(right - 1, bottom - 1, right, bottom);
			if(br) objectsList.push(br.getObjects());
			else br = bl;
		} else {
			br = bl;
		}
	} else {
		br = tr;
	}
	
	if(tl !== tr) addAncestorElements(left, top, right, top + 1);
	if(tr !== br) addAncestorElements(right - 1, top, right, bottom);
	if(br !== bl) addAncestorElements(left, bottom - 1, right, bottom);
	if(bl !== tl) addAncestorElements(left, top, left + 1, bottom);
		
	// Intersections towards top left
	if(tl){
		if((left - minimumSize) < tl.left){
			addAncestorElements(left - minimumSize, top, left + 1, top + 1);
		}

		if((top - minimumSize) < tl.top){
			addAncestorElements(left, top - minimumSize, left + 1, top + 1);
		}
	}
	
	// Intersections towards top right
	if(tr){
		if(tr !== tl && (top - minimumSize) < tr.top){
			addAncestorElements(right - 1, top - minimumSize, right, top + 1);
		}

		if((right + minimumSize) > tr.right){
			addAncestorElements(right - 1, top, right + minimumSize, top + 1);
		}
	}

	// Intersections towards bottom right
	if(br){
		if(br !== tr && (right + minimumSize) > br.right){
			addAncestorElements(right - 1, bottom - 1, right + minimumSize, bottom);
		}

		if((bottom + minimumSize) > br.bottom){
			addAncestorElements(right - 1, bottom - 1, right, bottom + minimumSize);
		}
	}

	// Intersections towards bottom left
	if(bl){
		if(bl !== br && (bottom + minimumSize) > bl.bottom){
			addAncestorElements(left, bottom - 1, left + 1, bottom + minimumSize);
		}

		if(bl !== tl && (left - minimumSize) < bl.left){
			addAncestorElements(left - minimumSize, bottom - 1, left + 1, bottom);
		}
	}

	return Array.prototype.concat.apply([], objectsList);
};

Quadtree.prototype.getObjects = function(left, top, width, height){
	if(left !== void 0){
		var bottom = top + height,
			right = left + width,
			rectangles = this.getInteractableObjects(left, top, right, bottom),
			rectangleIndex = rectangles.length,
			result = [],
			rectangle;

		while(rectangleIndex--){
			rectangle = rectangles[rectangleIndex];
			
			// If there is intersection along the y-axis
			if(	(top <= rectangle.top ?
					(bottom >= rectangle.top) :
					(rectangle.bottom >= top)) && 
				// And if there is intersection along the x-axis
				(left <= rectangle.left ? 
					(right >= rectangle.left) :
					(rectangle.right >= left))){

				
				result.push(rectangle);
			}
		}
		
		return result;
	}

	return this.top.getObjects();
};

Quadtree.prototype.prune = function(left, top, width, height){
	var right = left + width,
		bottom = top + height,
		candidate,
		rejectedObjects = [];
		keptObjects = [];

	var objects = this.top.getObjects(),
		index = 0,
		length = objects.length;

	for(; index < length; index++){
		candidate = objects[index];

		if(	candidate.left < left || 
			candidate.top < top || 
			(candidate.left + candidate.width) > right ||
			(candidate.top + candidate.height) > bottom){
			rejectedObjects.push(candidate);
		} else {
			keptObjects.push(candidate);
		}
	}
	if(keptObjects.length){
		this.reset(keptObjects[0].left, keptObjects[0].top);
		index = 0;
		length = keptObjects.length;
		for(; index < length; index++){
			this.insert(keptObjects[index]);
		}
	} else {
		this.reset();
	}
	
	return rejectedObjects;
};

;return module.exports;}({},{});return __m0;}());