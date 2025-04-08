import pickle
import scipy
from neural_net import neuralNetwork
import numpy

# number of input, hidden and output nodes
input_nodes = 784
hidden_nodes = 200
output_nodes = 10

# learning rate
learning_rate = 0.01

# create instance of neural network
n = neuralNetwork(input_nodes, hidden_nodes, output_nodes, learning_rate)


# load the mnist training data CSV file into a list
training_data_file = open("dataset/mnist_train.csv", "r")
training_data_list = training_data_file.readlines()
training_data_file.close()


# train the neural network

# epochs is the number of times the training data set is used for training
epochs = 10

for e in range(epochs):
    print(f"Training epoch {e + 1} of {epochs}")
    # go through all records in the training data set
    for record in training_data_list:
        # split the record by the ',' commas
        all_values = record.split(",")
        # scale and shift the inputs
        inputs = (numpy.asarray(all_values[1:], dtype=float) / 255.0 * 0.99) + 0.01
        # create the target output values (all 0.01, except the desired label which is 0.99)
        targets = numpy.zeros(output_nodes) + 0.01
        # all_values[0] is the target label for this record
        targets[int(all_values[0])] = 0.99
        n.train(inputs, targets)

        ## create rotated variations
        # rotated anticlockwise by 10 degrees
        inputs_plus10_img = scipy.ndimage.rotate(
            inputs.reshape(28, 28), 10, cval=0.01, order=1, reshape=False
        )
        n.train(inputs_plus10_img.reshape(784), targets)
        # rotated clockwise by 10 degrees
        inputs_minus10_img = scipy.ndimage.rotate(
            inputs.reshape(28, 28), -10, cval=0.01, order=1, reshape=False
        )
        n.train(inputs_minus10_img.reshape(784), targets)

        pass
    pass

with open("model.pkl", "wb") as model_file:
    pickle.dump(n, model_file)
