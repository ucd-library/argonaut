
https://docs.google.com/presentation/d/1SlBwFhhWWYrKqnHlCTV-UeUYcUSWwzw-JchcYpmYHUo

# Graph Definition

The graph defines:
 - the graph `name`
 - a global `config` sent along with all messages
 - the `steps` object containing key/value pairs defining each node in the workflow.  The key is the node id and the value is the [Node Definition](#node-definition)

```js
{
  name : String,
  config : Object,
  steps : {
    'step-id' : NodeDefinition
  }
}
```

# Node Definition

```js
{
  description : String,
  dependsOn : DependsOn,
  image : String,
  topic : String,
  groupBy: GroupBy,
  cmd : Execute
}
```

# dependsOn

The depends on object defines the parent node(s).  It has the following parameters:
 - The `steps` array defines all parent nodes required to execute this node. Each object in the step array will have the following properties:
   - `id` is the [Node Definition](#node-definition) id that is required to run.
   - The `filters` array can be an array of string or object expressions that must all evaluate to `true` to run the step.  If no `fitlers` array is provided, this step will always run.
     - Filter `string`: if the filter is a string, then it will be evaluated inline for truthyness. ex: `"{{steps.product.details.band}} == 7"`
     - Filter `object`: if the filter is an object it needs to be an instance of [Execute](#execute) and the stdout needs to return either `true` or `false`. These execute expressions will be handles asyncronously and thus have added costs of time and compute.
 - The `window` paramater is required only if more than on parent node is in the steps array.  It defines a timeout window (ex: `5min`).  If the window expires this step will not run.

```js
{
  steps : [{
    id : String,
    filter : [
      String,
      Execute
    ]
  }],
  window : String,
}
```

# groupBy

The groupBy statment generates a unique key for each incoming message and groups similar keys together. This is a way to join multiple graphs together to create a new execution flow. 

The groupBy properties:
 - The groupBy `key` generates a unique key for each incoming message.  This can be a `string` or `array`.  If `array`, the array will be joined by `-` to generate the key (useful for long keys).  Examples:
   -  `{key : '{{steps.goesr-product.details.satellite}}' }`
   - ```
      {key : [
      '{{steps.goesr-product.details.satellite}}',
      '{{steps.goesr-product.details.date}}',
      '{{steps.goesr-product.details.hour}}',
      '{{steps.goesr-product.details.minsec}}',
      '{{steps.goesr-product.details.band}}',
      '{{steps.goesr-product.details.apid}}',
      '{{steps.goesr-product.details.block}}']}
      ```
 - The `window` string defines a timeout window

```js
{
  key : String,
  window : String,
  ready : Execute,
  debounce : String
}
```


# Execute

Run a command or filter on a container.  Define the container environment you wish to run, the 
command (`exec`) you wish to run and optional inline script.  Finally, map command output 
to the argonaut message, see [Node Communication](#node-communication) for more information.

```js
{
  image : {
    type : 'string',
    required : true,
    description : 'name of container image to run command'
  },
  exec : {
    type : 'string',
    required : true,
    description : 'command to run.  example: my-script.sh'
  },
  script : {
    type : 'string',
    description : `optional inline script to run.  Example, {"exec": "python"}
                  then write inline python code here.  Code will be written to temp file
                  and run as: python /tmp/123i93`
  },
  output : {
    // See Node Communication
  }
}
```

# Execute Steps

 - prepare
   - a pre execute [transform](#transform)
 - preCmd
   - [Execute](#execute) a command before the main command 
 - cmd
   - [Execute](#execute) the main command 
 - postCmd
   - [Execute](#execute) a command after the main command 
 - finalize
   - a post execute [transform](#transform)

# Node Communication

Nodes can send messages to children further along in the workflow chain using the [exec](#execute)
`output` parameter.  The `output` parameter should be key/value pairs where the key is the name
of the variable you wish to assign and the value is an object defining where to read the variable
from.  

You can read values from `stdout` or from `file`s on disk.  Regardless of location, data
should be JSON formated.

The output will be stored in the steps object in the Argonaut message.  Example, say you run
command foo which maps `stdout` to details. You could access in a child node via the following
dot template: `steps.foo.details` or a more detailed example: `{exec: 'node index.js --param={{steps.foo.details}}'}`.
See [Property Templates](#property-templates) for more information.

```js
{
  output : {
    '[variable-name]' : {
      from : {
        type : 'string',
        required : true,
        enum : ['file', 'stdout']
      }
      location : {
        type : 'string'
        description : 'required if "from" is file.  Location of json file on disk' 
      }
    } 
  }
}
```

# Message Templates

# Message Definition

```js
{
  id : {
    type : 'string'
  },
  runId : {
    type : 'string',
  },
  type : {
    type : 'string',
    required : true,
    enum : ['async-conditional', 'execute']
  },
  steps : {
    type : 'object'
  },
  metadata : {

  },
  command : {

  },
  response : {

  }
}
```