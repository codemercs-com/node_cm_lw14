// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

module.exports = function (RED) {
	"use strict";
	var I2C = require("i2c-bus");

	//Some defines
	const DALI_MODE_DACP = 0x00;
	const DALI_MODE_CMD = 0x01;
	const DALI_ADR_GROUP = 0x80;
	const DALI_ADR_SHORT = 0x00;

	//Some settings for LW14
	const LW14_I2C = 0x23;          //7Bit address
	const LW14_REG_STATUS = 0x00;   //Status register
	const LW14_REG_CMD = 0x01;      //Command register

	const LW14_STATUS_SIZE = 2;
	const LW14_CMD_SIZE = 3;

	//Answers of 'status' register
	const LW14_STATE_NONE = 0x00;
	const LW14_STATE_1BYTE = 0x01;
	const LW14_STATE_2BYTE = 0x02;
	const LW14_STATE_TIMEFRAME = 0x04;
	const LW14_STATE_VALID = 0x08;
	const LW14_STATE_FRAMEERROR = 0x10;
	const LW14_STATE_OVERRUN = 0x20;
	const LW14_STATE_BUSY = 0x40;
	const LW14_STATE_BUS_FAULT = 0x80;


	//Send DACP values (0...100%) to the device/group/broadcast
	function lw14_dacp(n) {
		RED.nodes.createNode(this, n);
		this.busno = isNaN(parseInt(n.busno)) ? 1 : parseInt(n.busno);	//I2C Bus (by default '1')
		this.address = n.address;			//I2C device address (7-bit)
		this.name = n.name;
		this.dali_type = n.dali_type;		//Select type (single, group, broadcast)
		this.dali_adr = n.dali_adr;			//device num 0...63
		this.dali_value = n.dali_value;		//value of DALI (0...255, 255 -> MASK)

		var node = this;
		node.port = I2C.openSync(node.busno);
		var i2c_device = parseInt(node.address, 16);
		var dali_adr = 0x00;
		var dali_value = parseInt(node.dali_value);
		var dali_type = parseInt(node.dali_type);

		node.on("input", function (msg) {

			//Get valid DALI address
			if (dali_type == 0) dali_adr = DALI_ADR_GROUP | 0xFE | DALI_MODE_DACP;                              //Broadcast
			if (dali_type == 1) dali_adr = DALI_ADR_GROUP | ((node.dali_adr << 1) & 0xFE) | DALI_MODE_DACP;     //Group
			if (dali_type == 2) dali_adr = DALI_ADR_SHORT | ((node.dali_adr << 1) & 0xFE) | DALI_MODE_DACP;     //Short

			var wBuffer = Buffer.alloc(LW14_CMD_SIZE);
			wBuffer[0] = LW14_REG_CMD;
			wBuffer[1] = dali_adr;
			wBuffer[2] = dali_value;

			if (node.port.i2cWriteSync(i2c_device, LW14_CMD_SIZE, wBuffer) != LW14_CMD_SIZE) {
				node.error("Error: lw14_dacp() i2cWriteSync failed", msg);
			}

		});

		node.on("close", function () {
			node.port.closeSync();
		});
	}
	RED.nodes.registerType("lw14 dacp", lw14_dacp);


	//Send COMMAND values (MIN, MAX, etc) to the device/group/broadcast
	function lw14_command(n) {
		RED.nodes.createNode(this, n);
		this.busno = isNaN(parseInt(n.busno)) ? 1 : parseInt(n.busno);	//I2C Bus (by default '1')
		this.address = n.address;		//I2C device address (7-bit)
		this.name = n.name;
		this.dali_type = n.dali_type;		//Select type (single, group, broadcast)
		this.dali_adr = n.dali_adr;         //device num 0...63
		this.dali_value = n.dali_value;     //value of DALI (0...255, 255 -> MASK)

		var node = this;
		node.port = I2C.openSync(node.busno);
		var i2c_device = parseInt(node.address, 16);
		var dali_adr = 0x00;
		var dali_value = parseInt(node.dali_value);
		var dali_type = parseInt(node.dali_type);

		node.on("input", function (msg) {

			//Get valid DALI address
			if (dali_type == 0) dali_adr = DALI_ADR_GROUP | 0xFE | DALI_MODE_CMD;                              //Broadcast
			if (dali_type == 1) dali_adr = DALI_ADR_GROUP | ((node.dali_adr << 1) & 0xFE) | DALI_MODE_CMD;     //Group
			if (dali_type == 2) dali_adr = DALI_ADR_SHORT | ((node.dali_adr << 1) & 0xFE) | DALI_MODE_CMD;     //Short

			var wBuffer = Buffer.alloc(LW14_CMD_SIZE);
			wBuffer[0] = LW14_REG_CMD;
			wBuffer[1] = dali_adr;
			wBuffer[2] = dali_value;

			if (node.port.i2cWriteSync(i2c_device, LW14_CMD_SIZE, wBuffer) != LW14_CMD_SIZE)
				node.error("Error: lw14_command() i2cWriteSync failed", msg);
		});

		node.on("close", function () {
			node.port.closeSync();
		});
	}
	RED.nodes.registerType("lw14 cmd", lw14_command);


	//Call a SCENE
	function lw14_scene(n) {
		RED.nodes.createNode(this, n);
		this.busno = isNaN(parseInt(n.busno)) ? 1 : parseInt(n.busno);	//I2C Bus (by default '1')
		this.address = n.address;		//I2C device address (7-bit)
		this.name = n.name;
		this.dali_type = n.dali_type;		//Select type (single, group, broadcast)
		this.dali_adr = n.dali_adr;         //device num 0...63
		this.dali_value = n.dali_value;     //value of DALI (0...255, 255 -> MASK)

		var node = this;
		node.port = I2C.openSync(node.busno);
		var i2c_device = parseInt(node.address, 16);
		var dali_adr = 0x00;
		var dali_value = parseInt(node.dali_value);
		var dali_type = parseInt(node.dali_type);

		node.on("input", function (msg) {

			//Get valid DALI address
			if (dali_type == 0) dali_adr = DALI_ADR_GROUP | 0xFE | DALI_MODE_CMD;                              //Broadcast
			if (dali_type == 1) dali_adr = DALI_ADR_GROUP | ((node.dali_adr << 1) & 0xFE) | DALI_MODE_CMD;     //Group
			if (dali_type == 2) dali_adr = DALI_ADR_SHORT | ((node.dali_adr << 1) & 0xFE) | DALI_MODE_CMD;     //Short

			var wBuffer = Buffer.alloc(LW14_CMD_SIZE);
			wBuffer[0] = LW14_REG_CMD;
			wBuffer[1] = dali_adr;
			wBuffer[2] = dali_value;

			if (node.port.i2cWriteSync(i2c_device, LW14_CMD_SIZE, wBuffer) != LW14_CMD_SIZE)
				node.error("Error: lw14_scene() i2cWriteSync failed", msg);
		});

		node.on("close", function () {
			node.port.closeSync();
		});
	}
	RED.nodes.registerType("lw14 scene", lw14_scene);


	//Get a QUERY value from a single device
	function lw14_query(n) {
		RED.nodes.createNode(this, n);
		this.busno = isNaN(parseInt(n.busno)) ? 1 : parseInt(n.busno);	//I2C Bus (by default '1')
		this.address = n.address;		//I2C device address (7-bit)
		this.name = n.name;
		this.dali_adr = n.dali_adr;         //device num 0...63
		this.dali_value = n.dali_value;     //value of DALI (0...255, 255 -> MASK)

		var node = this;
		node.port = I2C.openSync(node.busno);
		var i2c_device = parseInt(node.address, 16);
		var dali_adr = 0x00;
		var dali_value = parseInt(node.dali_value);

		node.on("input", function (msg) {
			dali_adr = DALI_ADR_SHORT | ((node.dali_adr << 1) & 0xFE) | DALI_MODE_CMD; //Querys work only with single devices

			var sBuffer = Buffer.alloc(LW14_STATUS_SIZE);
			var wBuffer = Buffer.alloc(LW14_CMD_SIZE);
			var rBuffer = Buffer.alloc(LW14_CMD_SIZE);
			var error_count = 0;

			while (1) {
				if (node.port.i2cReadSync(i2c_device, LW14_STATUS_SIZE, sBuffer) == LW14_STATUS_SIZE) {
					if ((sBuffer[0] & LW14_STATE_BUS_FAULT) == LW14_STATE_BUS_FAULT) {
						break;
					}
					if ((sBuffer[0] & LW14_STATE_BUSY) != LW14_STATE_BUSY) {
						break;
					}
				}
				else {
					error_count++;
				}

				if (error_count > 10) {
					node.error("Error: Too many i2cReadSync() errors on reading status register to wait for bus ready", msg);
					break;
				}
			}

			//Send Query command to device
			wBuffer[0] = LW14_REG_CMD;
			wBuffer[1] = dali_adr;
			wBuffer[2] = dali_value;

			if (node.port.i2cWriteSync(i2c_device, LW14_CMD_SIZE, wBuffer) == LW14_CMD_SIZE) {
				if (node.port.i2cReadSync(i2c_device, LW14_CMD_SIZE, rBuffer) != LW14_CMD_SIZE)
					node.error("Error: lw14_query() i2cReadSync failed", msg);
			}
			else
				node.error("Error: lw14_query() i2cWriteSync failed", msg);

			//Wait until data ready (should return in <100ms)
			error_count = 0;
			while (1) {
				if (node.port.i2cReadSync(i2c_device, LW14_STATUS_SIZE, sBuffer) == LW14_STATUS_SIZE) {
					if ((sBuffer[0] & LW14_STATE_BUS_FAULT) == LW14_STATE_BUS_FAULT) {
						break;
					}
					if ((sBuffer[0] & (LW14_STATE_VALID | LW14_STATE_1BYTE)) == (LW14_STATE_VALID | LW14_STATE_1BYTE)) {
						break;
					}
				}
				else {
					error_count++;
				}

				if (error_count > 10) {
					node.error("Error: Too many i2cReadSync() errors on reading status register to wait for data from device", msg);
					break;
				}
			}

			rBuffer[0] = LW14_REG_CMD;
			if (node.port.i2cWriteSync(i2c_device, 1, wBuffer) == 1) {  //Set i2c address pointer to register COMMAND
				if (node.port.i2cReadSync(i2c_device, LW14_CMD_SIZE, rBuffer) == LW14_CMD_SIZE) {
					var msg = {};
					msg = {
						payload: {
							address: node.dali_adr,
							query: node.dali_value,
							value: rBuffer[0]
						}
					};
					node.send(msg);
				}
				else
					node.error("Error: lw14_query() i2cReadSync failed", msg);
			}
			else
				node.error("Error: lw14_query() i2cWriteSync failed", msg);
		});

		node.on("close", function () {
			node.port.closeSync();
		});
	}
	RED.nodes.registerType("lw14 query", lw14_query);
}