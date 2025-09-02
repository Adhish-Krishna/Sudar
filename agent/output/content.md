# Java OOPS Concepts Worksheet for Grade 11

## Instructions:
Answer the following questions based on Java Object-Oriented Programming concepts. Use proper syntax and explain your answers where required.

---

## Multiple Choice Questions (10 questions)

**1.** What is the primary purpose of encapsulation in Java?
A. To allow multiple classes to share data
B. To restrict direct access to objects' data
C. To enable inheritance between classes
D. To allow method overriding

**2.** Which keyword is used to achieve inheritance in Java?
A. extends
B. implements
C. inherits
D. override

**3.** What does polymorphism allow in Java?
A. Multiple classes to be inherited
B. Multiple methods to be called with the same name
C. Multiple classes to be declared in a single file
D. Multiple variables to be declared in a single class

**4.** What is an abstract class?
A. A class that cannot be instantiated
B. A class that must be inherited by other classes
C. A class that contains only abstract methods
D. All of the above

**5.** Which of the following is a correct way to create an object in Java?
A. Class_name object_name = new Class_name();
B. Class_name object_name = new Class_name();
C. object_name = new Class_name();
D. Both A and B

**6.** What is the difference between method overriding and method overloading?
A. Overriding changes the method signature, overloading does not
B. Overloading changes the method signature, overriding does not
C. Overriding is used for inheritance, overloading is not
D. Overloading is used for inheritance, overriding is not

**7.** What is the purpose of a constructor in Java?
A. To initialize object properties
B. To declare class variables
C. To define methods
D. To store data in the class

**8.** Which of the following is an example of abstraction in Java?
A. A class with only abstract methods
B. A class with no methods
C. A class with no variables
D. A class with all methods implemented

**9.** What is the difference between a class and an object?
A. A class is an instance of an object
B. An object is an instance of a class
C. A class is a type, an object is an instance
D. There is no difference

**10.** What is the purpose of the `this` keyword in Java?
A. To refer to the current object
B. To refer to the parent class
C. To refer to the static method
D. To refer to the static variable

---

## Programming Questions (5 questions)

**1.** Write a Java class called `Student` with private instance variables for name and roll number. Include public getter methods for both variables. 

**2.** Create a `Vehicle` class with a method `startEngine()`. Then create a `Car` class that inherits from `Vehicle` and overrides the `startEngine()` method to print "Car engine started". 

**3.** Implement an `Account` class with a balance variable. Include methods to deposit and withdraw money. Ensure that the balance cannot be negative. 

**4.** Write a Java program that demonstrates polymorphism. Create a base class `Shape` with a method `draw()`, then create two subclasses `Circle` and `Square` that override the `draw()` method. 

**5.** Design a class hierarchy for a school library system. Include a `Book` class with title and author, a `Student` class with name and roll number, and a `Library` class that manages a list of books and students. 

---

## Answer Key

### MCQ Answers:
1. B
2. A
3. B
4. D
5. A
6. B
7. A
8. A
9. C
10. A

### Programming Answers:
1. 
```java
public class Student {
    private String name;
    private int rollNumber;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getRollNumber() {
        return rollNumber;
    }

    public void setRollNumber(int rollNumber) {
        this.rollNumber = rollNumber;
    }
}
``` 

2. 
```java
class Vehicle {
    public void startEngine() {
        System.out.println("Vehicle engine started");
    }
}

class Car extends Vehicle {
    @Override
    public void startEngine() {
        System.out.println("Car engine started");
    }
}
``` 

3. 
```java
public class Account {
    private double balance;

    public void deposit(double amount) {
        if (amount > 0) {
            balance += amount;
        }
    }

    public void withdraw(double amount) {
        if (amount > 0 && balance >= amount) {
            balance -= amount;
        }
    }

    public double getBalance() {
        return balance;
    }
}
``` 

4. 
```java
abstract class Shape {
    public abstract void draw();
}

class Circle extends Shape {
    @Override
    public void draw() {
        System.out.println("Drawing a circle");
    }
}

class Square extends Shape {
    @Override
    public void draw() {
        System.out.println("Drawing a square");
    }
}

// Usage
Shape shape = new Circle();
shape.draw(); // Output: Drawing a circle

shape = new Square();
shape.draw(); // Output: Drawing a square
``` 

5. 
```java
class Book {
    private String title;
    private String author;

    public Book(String title, String author) {
        this.title = title;
        this.author = author;
    }

    public String getTitle() {
        return title;
    }

    public String getAuthor() {
        return author;
    }
}

class Student {
    private String name;
    private int rollNumber;

    public Student(String name, int rollNumber) {
        this.name = name;
        this.rollNumber = rollNumber;
    }

    public String getName() {
        return name;
    }

    public int getRollNumber() {
        return rollNumber;
    }
}

class Library {
    private List<Book> books;
    private List<Student> students;

    public Library() {
        books = new ArrayList<>();
        students = new ArrayList<>();
    }

    public void addBook(Book book) {
        books.add(book);
    }

    public void addStudent(Student student) {
        students.add(student);
    }

    public void displayBooks() {
        for (Book book : books) {
            System.out.println("Book: " + book.getTitle() + " by " + book.getAuthor());
        }
    }

    public void displayStudents() {
        for (Student student : students) {
            System.out.println("Student: " + student.getName() + " (Roll: " + student.getRollNumber() + ")");
        }
    }
}
```