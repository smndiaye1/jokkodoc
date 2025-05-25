# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
# --no-cache-dir: Disables the pip cache, which can reduce image size.
# --trusted-host pypi.python.org: Can sometimes help in environments with SSL/TLS interception.
RUN pip install --no-cache-dir --trusted-host pypi.python.org -r requirements.txt

# Copy the rest of the application code into the container
COPY app.py .
COPY templates/ templates/
COPY static/ static/

# Make port 8000 available to the world outside this container
EXPOSE 8000

# Define environment variable for the API key (to be set at runtime)
ENV OPENAI_API_KEY=""

# Run app.py when the container launches using Gunicorn
# Bind to 0.0.0.0 to allow external connections
# app:app refers to the 'app' Flask instance in the 'app.py' file
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "app:app"]
